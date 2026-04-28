// apps/web/src/api/observations.ts
import { supabase } from '../services/supabase';
import type { Observation } from '../types/observation';
import {
  buildObservationRpcArgs,
  deriveHasMore,
  type ObservationQueryParams,
  type ObservationBounds,
} from '@waterways/shared';
import TZLookup from 'tz-lookup';

export type { ObservationQueryParams, ObservationBounds };

export interface ObservationYearsQueryParams {
  projectId?: string;
  myProjectsOnly?: boolean;
}

// EWKB geography(POINT) comes back from Supabase as a hex string like:
// "0101000020E6100000BE9F1A2FDD6856C0A089B0E1E95D4540"
// This function parses that into { lat, lng }.
function parseEwkbPoint(ewkb: string | null | unknown): { lat: number; lng: number } {
  if (!ewkb || typeof ewkb !== 'string') {
    return { lat: 0, lng: 0 };
  }

  try {
    const hex = ewkb.trim();
    if (hex.length < 2 + 8 + 16) {
      return { lat: 0, lng: 0 };
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    const view = new DataView(bytes.buffer);

    // Byte 0 is the endian flag: 1 = little endian, 0 = big endian
    const littleEndian = view.getUint8(0) === 1;

    // Next 4 bytes: type + flags (EWKB)
    const type = view.getUint32(1, littleEndian);

    // If the SRID flag (0x20000000) is set, there is a 4-byte SRID after the type
    const SRID_FLAG = 0x20000000;
    let offset = 1 + 4; // byte order + type
    const hasSrid = (type & SRID_FLAG) === SRID_FLAG;
    if (hasSrid) {
      offset += 4; // skip SRID
    }

    const x = view.getFloat64(offset, littleEndian); // longitude
    const y = view.getFloat64(offset + 8, littleEndian); // latitude

    return { lat: y, lng: x };
  } catch (err) {
    console.error('Failed to parse EWKB point:', ewkb, err);
    return { lat: 0, lng: 0 };
  }
}

// Shape of the row from Supabase for observations + joins
type ObservationRow = {
  id: string;
  location: string | null; // EWKB geography hex string
  user_id: string | null;
  trip_id: string | null;
  created_at: string | null;
  observation: string | null;
  categories: string[] | null;
  observation_media: string[] | null;
  project_id: string | null;
  project_name: string | null;
  project_description: string | null;
  observer_first_name: string | null;
  observer_last_name: string | null;
  observer_is_deleted?: boolean | null;
  viewer_is_admin?: boolean | null;
  latitude: number | null;
  longitude: number | null;
  deleted?: boolean | null;
  total_count?: number | string | null;
};

type UserObserverProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  share_name_on_map: boolean;
  status: string | null;
};

type DailyObservationRow = {
  id: string;
  location: string | null;
  user_id: string | null;
  trip_id: string | null;
  created_at: string;
  observation: string | null;
  categories: string[] | null;
  observation_media: string[] | null;
  deleted?: boolean | null;
  observer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  trip: {
    project: {
      name: string | null;
    } | null;
  } | null;
};

export interface FetchObservationsResult {
  observations: Observation[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
  pageSize: number;
}

function isDeletedUserProfile(profile: UserObserverProfileRow | undefined): boolean {
  if (!profile) {
    return false;
  }

  const email = profile.email?.trim().toLowerCase() ?? '';
  return email.startsWith('deleted-') && email.endsWith('@deleted.local');
}

function getProfileFullName(profile: UserObserverProfileRow | undefined): string {
  if (!profile) {
    return '';
  }

  return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
}

async function getObserverContext(rows: ObservationRow[]): Promise<{
  isAdminViewer: boolean;
  profilesById: Map<string, UserObserverProfileRow>;
}> {
  const profilesById = new Map<string, UserObserverProfileRow>();
  let isAdminViewer = false;
  const canQueryUsers = typeof supabase.from === 'function';

  const userIds = Array.from(
    new Set(rows.map((row) => row.user_id).filter((value): value is string => Boolean(value)))
  );

  if (canQueryUsers && supabase.auth && typeof supabase.auth.getUser === 'function') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: actorRoleRow, error: actorRoleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!actorRoleError && actorRoleRow?.role === 'admin') {
        isAdminViewer = true;
      }
    }
  }

  if (!canQueryUsers) {
    return { isAdminViewer, profilesById };
  }

  if (userIds.length === 0) {
    return { isAdminViewer, profilesById };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, share_name_on_map, status')
    .in('id', userIds);

  if (profilesError) {
    console.warn('Failed to fetch observer profiles:', profilesError.message);
    return { isAdminViewer, profilesById };
  }

  for (const profile of (profiles ?? []) as UserObserverProfileRow[]) {
    profilesById.set(profile.id, profile);
  }

  return { isAdminViewer, profilesById };
}

function mapRowToObservation(
  row: ObservationRow,
  options?: {
    isAdminViewer?: boolean;
    profilesById?: Map<string, UserObserverProfileRow>;
  }
): Observation {
  let lat = row.latitude ?? 0;
  let lng = row.longitude ?? 0;

  if ((row.latitude == null || row.longitude == null) && row.location) {
    const parsed = parseEwkbPoint(row.location);
    lat = parsed.lat;
    lng = parsed.lng;
  }

  const projectName = row.project_name ?? 'Untitled Project';

  const observerProfile = row.user_id ? options?.profilesById?.get(row.user_id) : undefined;
  const isAdminViewer = options?.isAdminViewer === true;
  const observerFullName = getProfileFullName(observerProfile);
  const observerIsDeleted =
    row.observer_is_deleted === true ||
    observerProfile?.status === 'banned' ||
    isDeletedUserProfile(observerProfile);

  let observerName = 'Anonymous';
  if (isAdminViewer) {
    if (!row.user_id || observerIsDeleted) {
      if (row.user_id) {
        observerName = `Deleted_User#${row.user_id}`;
      } else {
        observerName = 'Deleted_User';
      }
    } else if (!observerFullName) {
      observerName = `Anonymous#${row.user_id}`;
    } else {
      observerName = observerFullName;
    }
  } else if (!row.user_id || observerIsDeleted) {
    observerName = 'Deleted_User';
  } else if (row.observer_first_name || row.observer_last_name) {
    observerName = `${row.observer_first_name ?? ''} ${row.observer_last_name ?? ''}`.trim();
    if (!observerName) observerName = 'Anonymous';
  } else {
    observerName = 'Anonymous';
  }

  const createdRaw = row.created_at ?? '';

  let date = '';
  let timestamp = '';
  if (createdRaw) {
    const created = new Date(createdRaw);

    // Determine the timezone for this observation
    let timezone = 'UTC';
    if (lat !== 0 && lng !== 0) {
      try {
        timezone = TZLookup(lat, lng);
      } catch {
        // If lookup fails, fall back to UTC
        timezone = 'UTC';
      }
    }

    // Format date using the observation's timezone
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Format time in 12-hour format with AM/PM
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Get timezone abbreviation
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const tzParts = tzFormatter.formatToParts(created);
    const tzAbbr = tzParts.find((p) => p.type === 'timeZoneName')?.value || timezone;

    // Get date parts
    const dateParts = dateFormatter.formatToParts(created);
    const datePartsMap = new Map(dateParts.map((p) => [p.type, p.value]));

    date = `${datePartsMap.get('year')}-${datePartsMap.get('month')}-${datePartsMap.get('day')}`;

    // Get formatted time string and append timezone
    const timeString = timeFormatter.format(created);
    timestamp = `${timeString} ${tzAbbr}`;
  }

  const categories = Array.isArray(row.categories) ? row.categories : [];
  const media = Array.isArray(row.observation_media) ? row.observation_media : [];

  return {
    id: row.id,
    tripId: row.trip_id ?? undefined,
    projectName,
    journeyStartLocation: projectName || 'Trip start',
    location: {
      lat,
      lng,
      name: 'Observation location',
    },
    createdAt: createdRaw,
    timestamp,
    date,
    observation: row.observation ?? '',
    observerName,
    userId: row.user_id ?? '',
    photos: media,
    videos: [],
    type: categories[0] ?? 'Observation',
    keywords: categories,
  };
}

/**
 * Fetch observations from Supabase and convert them
 * into the Observation shape used by the dashboard.
 */
export async function fetchObservations(
  params: ObservationQueryParams = {}
): Promise<FetchObservationsResult> {
  const rpcArgs = buildObservationRpcArgs(params);
  const requestedOffset = params.offset ?? 0;
  const requestedLimit = params.limit ?? 2000;

  if (typeof supabase.rpc !== 'function') {
    console.error('Supabase RPC client is unavailable for fetchObservations');
    return {
      observations: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: null,
      pageSize: requestedLimit,
    };
  }

  const { data, error } = await supabase.rpc(
    'get_filtered_observations',
    rpcArgs as unknown as Record<string, string | number | boolean | string[] | null>
  );

  if (error) {
    console.error('Error fetching observations:', error);
    return {
      observations: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: null,
      pageSize: requestedLimit,
    };
  }

  const rows = (data ?? []) as ObservationRow[];
  const { isAdminViewer, profilesById } = await getObserverContext(rows);
  const observations = rows
    .filter((row) => row.deleted !== true)
    .map((row) => mapRowToObservation(row, { isAdminViewer, profilesById }));
  const totalCountRaw = rows[0]?.total_count;
  const parsedTotalFromString =
    typeof totalCountRaw === 'string' ? Number.parseInt(totalCountRaw, 10) : Number.NaN;
  const totalCount =
    typeof totalCountRaw === 'number'
      ? totalCountRaw
      : Number.isFinite(parsedTotalFromString)
        ? parsedTotalFromString
        : observations.length;
  const hasMore = deriveHasMore({
    requestedLimit,
    requestedOffset,
    returnedRows: observations.length,
    totalCount,
  });

  return {
    observations,
    totalCount,
    hasMore,
    nextOffset: hasMore ? requestedOffset + observations.length : null,
    pageSize: requestedLimit,
  };
}

/**
 * Fetch observations from the last 24 hours from Supabase.
 * Returns observations sorted by creation time (most recent first).
 */
export async function fetchDailyObservations(
  params: Pick<ObservationQueryParams, 'userId'> = {}
): Promise<Observation[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoISO = oneDayAgo.toISOString();

  const result = await fetchObservations({
    since: oneDayAgoISO,
    userId: params.userId,
  });
  return result.observations;
}

export interface ObservationRangeOptions {
  since: string;
  until?: string;
  userId?: string;
}

export interface DeletedObservationListOptions {
  since?: string;
  until?: string;
  userId?: string;
  search?: string;
  limit?: number;
}

export interface DeletedObservationRecord {
  id: string;
  userId: string;
  observerName: string;
  projectName: string;
  observation: string;
  categories: string[];
  createdAt: string;
  deletedAt: string | null;
}

export async function fetchObservationsForRangeWithRelations(
  options: ObservationRangeOptions
): Promise<Observation[]> {
  const { since, until, userId } = options;

  let query = supabase
    .from('observations')
    .select(
      `
      id,
      location,
      user_id,
      trip_id,
      created_at,
      observation,
      categories,
      observation_media,
      observer:users!observations_user_id_fkey(first_name, last_name, email),
      trip:trips!observations_trip_id_fkey(
        project:projects!trips_project_id_fkey(name)
      )
    `
    )
    .or('deleted.is.false,deleted.is.null')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (until) {
    query = query.lt('created_at', until);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching daily observations with relationships:', error);
    return [];
  }

  return (data ?? []).map((row) => {
    const dailyRow = row as DailyObservationRow;
    const parsed = parseEwkbPoint(dailyRow.location);

    const firstName = dailyRow.observer?.first_name?.trim() ?? '';
    const lastName = dailyRow.observer?.last_name?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const observerName = fullName || dailyRow.observer?.email?.trim() || 'Anonymous';

    const projectName = dailyRow.trip?.project?.name?.trim() || 'Untitled Project';
    const created = new Date(dailyRow.created_at);
    const categories = Array.isArray(dailyRow.categories) ? dailyRow.categories : [];
    const media = Array.isArray(dailyRow.observation_media) ? dailyRow.observation_media : [];

    return {
      id: dailyRow.id,
      tripId: dailyRow.trip_id ?? undefined,
      projectName,
      journeyStartLocation: projectName,
      location: {
        lat: parsed.lat,
        lng: parsed.lng,
        name: 'Observation location',
      },
      createdAt: dailyRow.created_at,
      timestamp: created.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      date: [
        created.getFullYear(),
        String(created.getMonth() + 1).padStart(2, '0'),
        String(created.getDate()).padStart(2, '0'),
      ].join('-'),
      observation: dailyRow.observation ?? '',
      observerName,
      userId: dailyRow.user_id ?? '',
      photos: media,
      videos: [],
      type: categories[0] ?? 'Observation',
      keywords: categories,
    } satisfies Observation;
  });
}

export async function fetchObservationCategories(): Promise<
  Array<{
    id: number;
    type: string;
    color: string | null;
    keywords: string[] | null;
    is_fallback: boolean;
    is_active: boolean;
  }>
> {
  const { data, error } = await supabase
    .from('observation_categories')
    .select('id, type, color, keywords, is_fallback, is_active')
    .order('type');

  if (error) {
    console.error('Error fetching observation categories:', error);
    return [];
  }

  console.log('Raw category data from database:', data);

  // Process the data to ensure keywords are properly parsed
  const processedData = (data || []).map((category) => ({
    ...category,
    is_active: category.is_active ?? true,
    keywords: (() => {
      if (!category.keywords) return null;
      if (Array.isArray(category.keywords)) return category.keywords;

      // If keywords is a string, try to parse it as JSON
      if (typeof category.keywords === 'string') {
        try {
          const parsed = JSON.parse(category.keywords);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          // If not valid JSON, split by comma
          return (category.keywords as string)
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
        }
      }
      return null;
    })(),
  }));

  console.log('Processed category data:', processedData);
  return processedData;
}

export async function fetchObservationTypes(): Promise<string[]> {
  const uniqueTypes = new Set<string>();

  const addType = (value: unknown) => {
    if (typeof value !== 'string') {
      return;
    }

    const normalized = value.trim();
    if (normalized) {
      uniqueTypes.add(normalized);
    }
  };

  const addTypesFromCategories = (categories: unknown) => {
    if (!Array.isArray(categories)) {
      return;
    }

    for (const category of categories) {
      addType(category);
    }
  };

  try {
    if (typeof supabase.rpc === 'function') {
      const { data, error } = await supabase.rpc('get_observation_types');

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (typeof row === 'string') {
            addType(row);
            continue;
          }

          if (row && typeof row === 'object' && 'type' in row) {
            addType((row as { type?: unknown }).type);
          }
        }
      }
    }
  } catch (error) {
    console.warn(
      'get_observation_types RPC unavailable, falling back to direct observation scan:',
      error
    );
  }

  if (uniqueTypes.size === 0) {
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('observations')
        .select('categories')
        .or('deleted.is.false,deleted.is.null')
        .range(from, to);

      if (error) {
        console.error('Error fetching observation categories from observations:', error);
        break;
      }

      const rows = data ?? [];

      for (const row of rows) {
        addTypesFromCategories((row as { categories?: unknown }).categories);
      }

      if (rows.length < pageSize) {
        break;
      }

      from += pageSize;
    }
  }

  if (uniqueTypes.size === 0) {
    const { data, error } = await supabase
      .from('observation_categories')
      .select('type, is_active')
      .or('is_active.eq.true,is_active.is.null')
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching observation categories:', error);
      return [];
    }

    for (const row of data ?? []) {
      if (!row || typeof row.type !== 'string') {
        continue;
      }

      addType(row.type);
    }
  }

  return [...uniqueTypes].sort((a, b) => a.localeCompare(b));
}

export async function fetchObservationYears(
  params: ObservationYearsQueryParams = {}
): Promise<string[]> {
  if (typeof supabase.rpc !== 'function') {
    console.error('Supabase RPC client is unavailable for fetchObservationYears');
    return [];
  }

  const { data, error } = await supabase.rpc('get_observation_years', {
    p_project_id: params.projectId && params.projectId !== 'all' ? params.projectId : undefined,
    p_my_projects_only: params.myProjectsOnly ?? false,
  });

  if (error) {
    console.error('Error fetching observation years:', error);
    return [];
  }

  return (data ?? [])
    .map((row) => row.year)
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => b - a)
    .map((value) => String(value));
}

/**
 * Delete a single observation from Supabase by ID.
 */
export type DeleteResult = { success: boolean; error?: string; data?: unknown };

function isMissingDeletedColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const maybeDetails = 'details' in error && typeof error.details === 'string' ? error.details : '';
  const fullText = `${maybeMessage} ${maybeDetails}`.toLowerCase();

  return (
    fullText.includes('column') &&
    fullText.includes('deleted') &&
    fullText.includes('does not exist')
  );
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeMessage = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const maybeDetails = 'details' in error && typeof error.details === 'string' ? error.details : '';
  const fullText = `${maybeMessage} ${maybeDetails}`.toLowerCase();

  return (
    fullText.includes('column') &&
    fullText.includes(columnName.toLowerCase()) &&
    fullText.includes('does not exist')
  );
}

export async function deleteObservation(observationId: string): Promise<DeleteResult> {
  const softDeletePatch: Record<string, unknown> = {
    deleted: true,
    deleted_at: new Date().toISOString(),
  };

  const { error, data } = await supabase
    .from('observations')
    .update(softDeletePatch as never)
    .eq('id', observationId)
    .select('id');

  if (error) {
    console.error('Error soft deleting observation:', {
      observationId,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    if (isMissingDeletedColumnError(error)) {
      const fallback = await supabase
        .from('observations')
        .delete()
        .eq('id', observationId)
        .select('id');

      if (fallback.error) {
        console.error('Fallback hard delete failed:', {
          observationId,
          message: fallback.error.message,
          details: fallback.error.details,
          hint: fallback.error.hint,
          code: fallback.error.code,
        });
        return { success: false, error: fallback.error.message, data: fallback.data };
      }

      return {
        success: true,
        data: fallback.data,
      };
    }

    if (isMissingColumnError(error, 'deleted_at')) {
      const retry = await supabase
        .from('observations')
        .update({ deleted: true } as never)
        .eq('id', observationId)
        .select('id');

      if (retry.error) {
        return { success: false, error: retry.error.message, data: retry.data };
      }

      return { success: true, data: retry.data };
    }

    return { success: false, error: error.message, data };
  }

  const updatedRows = Array.isArray(data) ? data.length : 0;
  if (updatedRows === 0) {
    return {
      success: false,
      error:
        'No observation was updated. It may already be deleted or your account does not have permission to delete it.',
      data,
    };
  }

  return { success: true, data };
}

/**
 * Delete all observations by a specific user from Supabase.
 */
export async function deleteAllUserObservations(userId: string): Promise<DeleteResult> {
  const softDeletePatch: Record<string, unknown> = {
    deleted: true,
    deleted_at: new Date().toISOString(),
  };

  const { error, data } = await supabase
    .from('observations')
    .update(softDeletePatch as never)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    console.error('Error soft deleting user observations:', {
      userId,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    if (isMissingDeletedColumnError(error)) {
      const fallback = await supabase
        .from('observations')
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (fallback.error) {
        console.error('Fallback hard delete for user observations failed:', {
          userId,
          message: fallback.error.message,
          details: fallback.error.details,
          hint: fallback.error.hint,
          code: fallback.error.code,
        });
        return { success: false, error: fallback.error.message, data: fallback.data };
      }

      return {
        success: true,
        data: fallback.data,
      };
    }

    if (isMissingColumnError(error, 'deleted_at')) {
      const retry = await supabase
        .from('observations')
        .update({ deleted: true } as never)
        .eq('user_id', userId)
        .select('id');

      if (retry.error) {
        return { success: false, error: retry.error.message, data: retry.data };
      }

      return { success: true, data: retry.data };
    }

    return { success: false, error: error.message, data };
  }

  const updatedRows = Array.isArray(data) ? data.length : 0;
  if (updatedRows === 0) {
    return {
      success: false,
      error:
        'No observations were updated. They may already be deleted or your account does not have permission to delete them.',
      data,
    };
  }

  return { success: true, data };
}

export async function fetchDeletedObservationsForAdmin(
  options: DeletedObservationListOptions = {}
): Promise<DeletedObservationRecord[]> {
  const { since, until, userId, search, limit = 1000 } = options;

  type AdminDeletedPostsQuery = {
    eq: (column: string, value: unknown) => AdminDeletedPostsQuery;
    order: (column: string, options?: Record<string, unknown>) => AdminDeletedPostsQuery;
    limit: (value: number) => AdminDeletedPostsQuery;
    gte: (column: string, value: string) => AdminDeletedPostsQuery;
    lt: (column: string, value: string) => AdminDeletedPostsQuery;
    then: PromiseLike<{
      data: unknown[] | null;
      error: { message?: string; details?: unknown } | null;
    }>['then'];
  };

  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => AdminDeletedPostsQuery;
    };
  };

  const query = client
    .from('observations')
    .select(
      `
      id,
      user_id,
      created_at,
      deleted_at,
      observation,
      categories,
      observer:users!observations_user_id_fkey(first_name, last_name, email),
      trip:trips!observations_trip_id_fkey(
        project:projects!trips_project_id_fkey(name)
      )
    `
    )
    .eq('deleted', true)
    .order('deleted_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  let filteredQuery = query;
  if (userId) {
    filteredQuery = filteredQuery.eq('user_id', userId);
  }

  let { data, error } = await filteredQuery;

  if (error) {
    const rawDetails = (error as { details?: unknown }).details;
    const detailsText = typeof rawDetails === 'string' ? rawDetails : '';
    const details = `${error.message ?? ''} ${detailsText}`.toLowerCase();
    const missingDeletedAt = details.includes('deleted_at') && details.includes('does not exist');

    if (missingDeletedAt) {
      const fallbackBase = client
        .from('observations')
        .select(
          `
          id,
          user_id,
          created_at,
          observation,
          categories,
          observer:users!observations_user_id_fkey(first_name, last_name, email),
          trip:trips!observations_trip_id_fkey(
            project:projects!trips_project_id_fkey(name)
          )
        `
        )
        .eq('deleted', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      const fallbackQuery = userId ? fallbackBase.eq('user_id', userId) : fallbackBase;
      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }
  }

  if (error) {
    console.error('Error fetching deleted observations for admin:', error);
    return [];
  }

  const searchTerm = search?.trim().toLowerCase();

  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string | null;
    created_at: string | null;
    deleted_at?: string | null;
    observation: string | null;
    categories: string[] | null;
    observer?: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
    trip?: { project?: { name: string | null } | null } | null;
  }>;

  const mapped = rows.map((row) => {
    const firstName = row.observer?.first_name?.trim() ?? '';
    const lastName = row.observer?.last_name?.trim() ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const observerName = fullName || row.observer?.email?.trim() || 'Anonymous';

    return {
      id: row.id,
      userId: row.user_id ?? '',
      observerName,
      projectName: row.trip?.project?.name?.trim() || 'Untitled Project',
      observation: row.observation ?? '',
      categories: Array.isArray(row.categories) ? row.categories : [],
      createdAt: row.created_at ?? '',
      deletedAt: row.deleted_at ?? null,
    } satisfies DeletedObservationRecord;
  });

  const rangeFiltered = mapped.filter((item: DeletedObservationRecord) => {
    const deletedTimeRaw = item.deletedAt;
    if (!deletedTimeRaw) {
      return false;
    }

    const time = new Date(deletedTimeRaw).getTime();

    if (!Number.isFinite(time)) {
      return false;
    }

    if (since) {
      const sinceTime = new Date(since).getTime();
      if (Number.isFinite(sinceTime) && time < sinceTime) {
        return false;
      }
    }

    if (until) {
      const untilTime = new Date(until).getTime();
      if (Number.isFinite(untilTime) && time >= untilTime) {
        return false;
      }
    }

    return true;
  });

  if (!searchTerm) {
    return rangeFiltered;
  }

  return rangeFiltered.filter((item: DeletedObservationRecord) => {
    const haystack = [
      item.observerName,
      item.projectName,
      item.observation,
      item.categories.join(' '),
      item.userId,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm);
  });
}

export async function restoreObservation(observationId: string): Promise<DeleteResult> {
  const { error, data } = await supabase
    .from('observations')
    .update({ deleted: false, deleted_at: null } as never)
    .eq('id', observationId)
    .eq('deleted', true)
    .select('id');

  if (error) {
    console.error('Error restoring observation:', error);
    return { success: false, error: error.message, data };
  }

  return { success: true, data };
}

export async function restoreAllUserObservations(userId: string): Promise<DeleteResult> {
  const { error, data } = await supabase
    .from('observations')
    .update({ deleted: false, deleted_at: null } as never)
    .eq('user_id', userId)
    .eq('deleted', true)
    .select('id');

  if (error) {
    console.error('Error restoring all user observations:', error);
    return { success: false, error: error.message, data };
  }

  return { success: true, data };
}
