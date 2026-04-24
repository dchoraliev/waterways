/// @ts-nocheck

// Required environment variables:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - RESEND_API_KEY
// - RESEND_FROM_EMAIL
// - DAILY_SUMMARY_CRON_SECRET
//
// Optional environment variables:
// - DAILY_SUMMARY_INTERVAL_MINUTES (default: 5, production: 1440)
//
// Invocation auth:
// - verify_jwt is disabled for this function.
// - Caller must provide x-daily-summary-secret header (or Authorization: Bearer <secret>)
//   matching DAILY_SUMMARY_CRON_SECRET.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-daily-summary-secret',
};

type DueUser = {
  user_id: string;
  window_start: string;
  window_end: string;
  updated_at: string;
  last_daily_summary: string | null;
};

type EmailSettingsRow = {
  user_id: string;
  updated_at: string;
  last_daily_summary: string | null;
};

type DailySummaryMetrics = {
  first_start_time: string | null;
  total_duration_seconds: number;
  general_location: string | null;
  total_observations: number;
  trip_count: number;
};

type FailureDetail = {
  userId: string;
  stage: 'resolve-recipient' | 'load-metrics' | 'send-email' | 'mark-sent';
  message: string;
};

function json(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeFromAddress(fromRaw: string): string {
  const value = fromRaw.trim();

  const bracketMatch = value.match(/^(.*?)\s*<([^<>\s]+)>$/);
  if (bracketMatch) {
    const displayName = bracketMatch[1].trim();
    const email = bracketMatch[2].trim().toLowerCase();

    if (!isValidEmail(email)) {
      throw new Error('RESEND_FROM_EMAIL has an invalid email address');
    }

    return displayName ? `${displayName} <${email}>` : email;
  }

  if (isValidEmail(value)) {
    return value.toLowerCase();
  }

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const candidateEmail = parts[parts.length - 1].toLowerCase();
    const displayName = parts.slice(0, -1).join(' ').trim();

    if (isValidEmail(candidateEmail)) {
      return displayName ? `${displayName} <${candidateEmail}>` : candidateEmail;
    }
  }

  throw new Error('RESEND_FROM_EMAIL must be email@domain.com or Name <email@domain.com>');
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function toDisplayDateTime(iso: string | null): string {
  if (!iso) {
    return 'N/A';
  }

  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return 'N/A';
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  const hours = String(value.getUTCHours()).padStart(2, '0');
  const minutes = String(value.getUTCMinutes()).padStart(2, '0');
  const seconds = String(value.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

function getSummaryIntervalMinutes(): number {
  const rawValue = Deno.env.get('DAILY_SUMMARY_INTERVAL_MINUTES') ?? '15';
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 15;
  }

  return Math.floor(parsed);
}

function parsePoint(value: unknown): { lat: number; lng: number } | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;

    if (Array.isArray(objectValue.coordinates) && objectValue.coordinates.length >= 2) {
      const lng = Number(objectValue.coordinates[0]);
      const lat = Number(objectValue.coordinates[1]);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    if (typeof objectValue.lat === 'number' && typeof objectValue.lng === 'number') {
      return { lat: objectValue.lat, lng: objectValue.lng };
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    const sridPointMatch = trimmed.match(
      /^SRID=\d+;POINT\(([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\)$/i
    );
    if (sridPointMatch) {
      const lng = Number(sridPointMatch[1]);
      const lat = Number(sridPointMatch[2]);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    const pointMatch = trimmed.match(/^POINT\(([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\)$/i);
    if (pointMatch) {
      const lng = Number(pointMatch[1]);
      const lat = Number(pointMatch[2]);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return parsePoint(parsed);
      } catch {
        // Continue trying other formats.
      }
    }

    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 42 && trimmed.length % 2 === 0) {
      const bytes = new Uint8Array(trimmed.length / 2);
      for (let i = 0; i < trimmed.length; i += 2) {
        bytes[i / 2] = Number.parseInt(trimmed.slice(i, i + 2), 16);
      }

      try {
        const dataView = new DataView(bytes.buffer);
        const littleEndian = dataView.getUint8(0) === 1;
        const typeWord = dataView.getUint32(1, littleEndian);
        const hasSrid = (typeWord & 0x20000000) !== 0;
        const geometryType = typeWord & 0xff;

        if (geometryType === 1) {
          const coordinateOffset = hasSrid ? 9 : 5;
          if (bytes.length >= coordinateOffset + 16) {
            const lng = dataView.getFloat64(coordinateOffset, littleEndian);
            const lat = dataView.getFloat64(coordinateOffset + 8, littleEndian);

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              return { lat, lng };
            }
          }
        }
      } catch {
        // Not a supported WKB/EWKB byte layout.
      }
    }
  }

  return null;
}

function formatGeneralLocation(value: unknown): string | null {
  const point = parsePoint(value);
  if (!point) {
    return null;
  }

  return `${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}`;
}

async function resolveRecipientEmail(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ email: string | null; error: Error | null }> {
  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (userError) {
    return { email: null, error: new Error(userError.message) };
  }

  const databaseEmail =
    typeof userData?.email === 'string' && isValidEmail(userData.email)
      ? userData.email.trim().toLowerCase()
      : null;

  if (databaseEmail) {
    return { email: databaseEmail, error: null };
  }

  const { data: authData, error: authError } = await serviceClient.auth.admin.getUserById(userId);

  if (authError) {
    return { email: null, error: new Error(authError.message) };
  }

  const authEmail =
    typeof authData?.user?.email === 'string' && isValidEmail(authData.user.email)
      ? authData.user.email.trim().toLowerCase()
      : null;

  return { email: authEmail, error: null };
}

async function getDueUsers(
  serviceClient: ReturnType<typeof createClient>,
  now: Date,
  summaryIntervalMinutes: number,
  limit = 100
): Promise<{ data: DueUser[] | null; error: Error | null }> {
  const pageSize = 500;
  const dueUsers: DueUser[] = [];
  let offset = 0;

  while (dueUsers.length < limit) {
    const { data, error } = await serviceClient
      .from('email')
      .select('user_id, updated_at, last_daily_summary')
      .eq('daily_summary', true)
      .order('updated_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const rows: EmailSettingsRow[] = Array.isArray(data) ? (data as EmailSettingsRow[]) : [];
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const updatedAt = new Date(row.updated_at);
      const lastDailySummary = row.last_daily_summary ? new Date(row.last_daily_summary) : null;
      const anchor =
        lastDailySummary && lastDailySummary.getTime() > updatedAt.getTime() ? lastDailySummary : updatedAt;

      if (Number.isNaN(anchor.getTime())) {
        continue;
      }

      if (addMinutes(anchor, summaryIntervalMinutes).getTime() <= now.getTime()) {
        dueUsers.push({
          user_id: row.user_id,
          window_start: anchor.toISOString(),
          window_end: now.toISOString(),
          updated_at: row.updated_at,
          last_daily_summary: row.last_daily_summary,
        });
      }

      if (dueUsers.length >= limit) {
        break;
      }
    }

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return { data: dueUsers, error: null };
}

async function getDailySummaryMetrics(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  windowStart: string,
  windowEnd: string
): Promise<{ data: DailySummaryMetrics | null; error: Error | null }> {
  const { data: trips, error: tripsError } = await serviceClient
    .from('trips')
    .select('id, start_time, end_time, start_location')
    .eq('user_id', userId)
    .gte('start_time', windowStart)
    .lt('start_time', windowEnd)
    .order('start_time', { ascending: true });

  if (tripsError) {
    return { data: null, error: new Error(tripsError.message) };
  }

  const tripRows = Array.isArray(trips) ? trips : [];
  let firstStartTime: string | null = null;
  let totalDurationSeconds = 0;
  let generalLocation: string | null = null;

  for (const trip of tripRows) {
    const startTime = typeof trip.start_time === 'string' ? new Date(trip.start_time) : null;
    if (!startTime || Number.isNaN(startTime.getTime())) {
      continue;
    }

    if (!firstStartTime) {
      firstStartTime = startTime.toISOString();
      generalLocation = formatGeneralLocation((trip as { start_location?: unknown }).start_location);
    }

    const endTime =
      typeof trip.end_time === 'string' ? new Date(trip.end_time) : new Date(startTime.getTime());
    if (!Number.isNaN(endTime.getTime())) {
      const deltaSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
      totalDurationSeconds += deltaSeconds;
    }
  }

  const tripIds = tripRows
    .map((trip) => (typeof (trip as { id?: unknown }).id === 'string' ? (trip as { id: string }).id : null))
    .filter((tripId): tripId is string => !!tripId);

  const { data: observationsByUser, error: observationsByUserError } = await serviceClient
    .from('observations')
    .select('id, created_at, location, trip_id')
    .eq('user_id', userId)
    .gte('created_at', windowStart)
    .lt('created_at', windowEnd);

  if (observationsByUserError) {
    return { data: null, error: new Error(observationsByUserError.message) };
  }

  let observationsByTrip: Array<{ id: string; created_at: string; location: unknown; trip_id: string | null }> = [];
  if (tripIds.length > 0) {
    const { data: tripLinkedObservations, error: observationsByTripError } = await serviceClient
      .from('observations')
      .select('id, created_at, location, trip_id')
      .in('trip_id', tripIds)
      .gte('created_at', windowStart)
      .lt('created_at', windowEnd);

    if (observationsByTripError) {
      return { data: null, error: new Error(observationsByTripError.message) };
    }

    observationsByTrip = Array.isArray(tripLinkedObservations)
      ? (tripLinkedObservations as Array<{
          id: string;
          created_at: string;
          location: unknown;
          trip_id: string | null;
        }>)
      : [];
  }

  const allObservationRows = [
    ...(Array.isArray(observationsByUser)
      ? (observationsByUser as Array<{
          id: string;
          created_at: string;
          location: unknown;
          trip_id: string | null;
        }>)
      : []),
    ...observationsByTrip,
  ];

  const observationById = new Map<
    string,
    { created_at: string; location: unknown; trip_id: string | null }
  >();
  for (const observation of allObservationRows) {
    if (!observationById.has(observation.id)) {
      observationById.set(observation.id, {
        created_at: observation.created_at,
        location: observation.location,
        trip_id: observation.trip_id,
      });
    }
  }

  const sortedObservations = Array.from(observationById.values()).sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime;
  });

  if (!firstStartTime && sortedObservations.length > 0) {
    firstStartTime = sortedObservations[0].created_at;
  }

  if (!generalLocation) {
    for (const observation of sortedObservations) {
      generalLocation = formatGeneralLocation(observation.location);
      if (generalLocation) {
        break;
      }
    }

    if (!generalLocation) {
      const linkedTripIds = Array.from(
        new Set(
          sortedObservations
            .map((observation) => observation.trip_id)
            .filter((tripId): tripId is string => !!tripId)
        )
      );

      if (linkedTripIds.length > 0) {
        const { data: linkedTrips, error: linkedTripsError } = await serviceClient
          .from('trips')
          .select('start_location')
          .in('id', linkedTripIds)
          .not('start_location', 'is', null)
          .limit(1);

        if (linkedTripsError) {
          return { data: null, error: new Error(linkedTripsError.message) };
        }

        const firstTripLocation = Array.isArray(linkedTrips) && linkedTrips.length > 0 ? linkedTrips[0] : null;
        generalLocation = formatGeneralLocation((firstTripLocation as { start_location?: unknown } | null)?.start_location);
      }
    }
  }

  const tripIdsFromTrips = tripRows
    .map((trip) => (typeof (trip as { id?: unknown }).id === 'string' ? (trip as { id: string }).id : null))
    .filter((tripId): tripId is string => !!tripId);

  const tripIdsFromObservations = sortedObservations
    .map((observation) => observation.trip_id)
    .filter((tripId): tripId is string => !!tripId);

  const uniqueTripIds = new Set<string>([...tripIdsFromTrips, ...tripIdsFromObservations]);

  return {
    data: {
      first_start_time: firstStartTime,
      total_duration_seconds: totalDurationSeconds,
      general_location: generalLocation,
      total_observations: observationById.size,
      trip_count: uniqueTripIds.size,
    },
    error: null,
  };
}

function buildDailySummaryEmailContent(
  metrics: DailySummaryMetrics,
  windowStart: string,
  windowEnd: string
): { subject: string; html: string; text: string } {
  const firstStart = toDisplayDateTime(metrics.first_start_time);
  const duration = formatDuration(metrics.total_duration_seconds);
  const generalLocation = metrics.general_location ?? 'N/A';
  const observations = metrics.total_observations ?? 0;
  const trips = metrics.trip_count ?? 0;

  const subject = 'Your Waterways Daily Summary';

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:640px;">` +
    `<h2 style="margin:0 0 10px 0;">Your Daily Summary</h2>` +
    `<p style="margin:0 0 12px 0;">Activity window: ${escapeHtml(toDisplayDateTime(windowStart))} to ${escapeHtml(toDisplayDateTime(windowEnd))}</p>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 12px 0;">` +
    `<tr><td style="padding:6px 0;font-weight:600;width:45%;">Start time</td><td style="padding:6px 0;">${escapeHtml(firstStart)}</td></tr>` +
    `<tr><td style="padding:6px 0;font-weight:600;">Total duration</td><td style="padding:6px 0;">${escapeHtml(duration)}</td></tr>` +
    `<tr><td style="padding:6px 0;font-weight:600;">General location</td><td style="padding:6px 0;">${escapeHtml(generalLocation)}</td></tr>` +
    `<tr><td style="padding:6px 0;font-weight:600;">Number of observations</td><td style="padding:6px 0;">${observations}</td></tr>` +
    `<tr><td style="padding:6px 0;font-weight:600;">Number of trips</td><td style="padding:6px 0;">${trips}</td></tr>` +
    `</table>` +
    `<p style="margin:0;">This summary is based on recorded trips and observations in your Waterways account.</p>` +
    `</div>`;

  const text = [
    'Your Waterways Daily Summary',
    `Activity window: ${toDisplayDateTime(windowStart)} to ${toDisplayDateTime(windowEnd)}`,
    `Start time: ${firstStart}`,
    `Total duration: ${duration}`,
    `General location: ${generalLocation}`,
    `Number of observations: ${observations}`,
    `Number of trips: ${trips}`,
  ].join('\n');

  return { subject, html, text };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const expectedSecret = (Deno.env.get('DAILY_SUMMARY_CRON_SECRET') ?? '').trim();
  const bearerHeader = req.headers.get('authorization') ?? '';
  let providedSecret = (req.headers.get('x-daily-summary-secret') ?? '').trim();

  if (!providedSecret && bearerHeader.toLowerCase().startsWith('bearer ')) {
    providedSecret = bearerHeader.slice(7).trim();
  }

  if (!expectedSecret) {
    return json(500, { error: 'DAILY_SUMMARY_CRON_SECRET is not configured' });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return json(401, { error: 'Unauthorized' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const resendFromEmailRaw = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey || !resendFromEmailRaw) {
    return json(500, {
      error:
        'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, or RESEND_FROM_EMAIL secret',
    });
  }

  let resendFromEmail: string;
  try {
    resendFromEmail = normalizeFromAddress(resendFromEmailRaw);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Invalid RESEND_FROM_EMAIL secret',
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const now = new Date();
  const nowIso = now.toISOString();
  const summaryIntervalMinutes = getSummaryIntervalMinutes();

  const { data: dueUsers, error: dueUsersError } = await getDueUsers(
    serviceClient,
    now,
    summaryIntervalMinutes,
    100
  );

  if (dueUsersError) {
    return json(500, { error: dueUsersError.message });
  }

  const rows: DueUser[] = Array.isArray(dueUsers) ? (dueUsers as DueUser[]) : [];
  if (!rows.length) {
    return json(200, {
      success: true,
      summaryIntervalMinutes,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let skippedMissingRecipient = 0;
  let skippedInvalidRecipient = 0;
  const failureDetails: FailureDetail[] = [];

  for (const row of rows) {
    const { email: recipient, error: recipientError } = await resolveRecipientEmail(
      serviceClient,
      row.user_id
    );

    if (recipientError) {
      failed += 1;
      if (failureDetails.length < 10) {
        failureDetails.push({
          userId: row.user_id,
          stage: 'resolve-recipient',
          message: recipientError.message,
        });
      }
      console.error(
        'Failed to resolve recipient email for daily summary:',
        row.user_id,
        recipientError.message
      );
      continue;
    }

    if (!recipient) {
      skipped += 1;
      skippedMissingRecipient += 1;
      console.warn('Skipping daily summary because recipient email is missing:', row.user_id);
      continue;
    }

    if (!isValidEmail(recipient)) {
      skipped += 1;
      skippedInvalidRecipient += 1;
      console.warn('Skipping daily summary because recipient email is invalid:', row.user_id, recipient);
      continue;
    }

    const { data: metricsData, error: metricsError } = await getDailySummaryMetrics(
      serviceClient,
      row.user_id,
      row.window_start,
      row.window_end
    );

    if (metricsError) {
      failed += 1;
      if (failureDetails.length < 10) {
        failureDetails.push({
          userId: row.user_id,
          stage: 'load-metrics',
          message: metricsError.message,
        });
      }
      console.error('Failed to load daily summary metrics:', row.user_id, metricsError.message);
      continue;
    }

    const metrics: DailySummaryMetrics = {
      first_start_time: metricsData?.first_start_time ?? null,
      total_duration_seconds: Number(metricsData?.total_duration_seconds ?? 0),
      general_location: metricsData?.general_location ?? null,
      total_observations: Number(metricsData?.total_observations ?? 0),
      trip_count: Number(metricsData?.trip_count ?? 0),
    };

    const { subject, html, text } = buildDailySummaryEmailContent(
      metrics,
      row.window_start,
      row.window_end
    );

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [recipient],
        subject,
        html,
        text,
        tags: [
          { name: 'feature', value: 'daily-summary-email' },
          { name: 'user_id', value: row.user_id },
        ],
      }),
    });

    if (!resendResponse.ok) {
      failed += 1;
      const raw = await resendResponse.text();
      if (failureDetails.length < 10) {
        failureDetails.push({
          userId: row.user_id,
          stage: 'send-email',
          message: `Resend HTTP ${resendResponse.status}: ${raw}`,
        });
      }
      console.error('Failed to send daily summary email:', row.user_id, resendResponse.status, raw);
      continue;
    }

    const { error: markSentError } = await serviceClient
      .from('email')
      .update({ last_daily_summary: nowIso })
      .eq('user_id', row.user_id);

    if (markSentError) {
      failed += 1;
      if (failureDetails.length < 10) {
        failureDetails.push({
          userId: row.user_id,
          stage: 'mark-sent',
          message: markSentError.message,
        });
      }
      console.error('Failed to mark last_daily_summary:', row.user_id, markSentError.message);
      continue;
    }

    sent += 1;
  }

  return json(200, {
    success: true,
    summaryIntervalMinutes,
    processed: rows.length,
    sent,
    failed,
    skipped,
      skippedMissingRecipient,
      skippedInvalidRecipient,
    failureDetails,
  });
});
