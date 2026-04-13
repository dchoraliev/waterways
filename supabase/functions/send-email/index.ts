/// @ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TemplateType = 'welcome' | 'password-reset' | 'generic';

type SendEmailBody = {
  template: TemplateType;
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  data?: {
    firstName?: string;
    appUrl?: string;
    resetUrl?: string;
  };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? '';
const ALLOW_EXTERNAL_EMAIL_RECIPIENTS =
  (Deno.env.get('ALLOW_EXTERNAL_EMAIL_RECIPIENTS') ?? 'false').toLowerCase() === 'true';

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

  // Already in "Display Name <email@domain.com>" format.
  const bracketMatch = value.match(/^(.*?)\s*<([^<>\s]+)>$/);
  if (bracketMatch) {
    const displayName = bracketMatch[1].trim();
    const email = bracketMatch[2].trim().toLowerCase();

    if (!isValidEmail(email)) {
      throw new Error('RESEND_FROM_EMAIL has an invalid email address');
    }

    return displayName ? `${displayName} <${email}>` : email;
  }

  // Plain email format.
  if (isValidEmail(value)) {
    return value.toLowerCase();
  }

  // Gracefully handle "Display Name email@domain.com" by using the last token as email.
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const candidateEmail = parts[parts.length - 1].toLowerCase();
    const displayName = parts.slice(0, -1).join(' ').trim();

    if (isValidEmail(candidateEmail)) {
      return displayName ? `${displayName} <${candidateEmail}>` : candidateEmail;
    }
  }

  throw new Error('RESEND_FROM_EMAIL must be either email@domain.com or Display Name <email@domain.com>');
}

function normalizeRecipients(to: string | string[] | undefined): string[] {
  if (!to) {
    return [];
  }

  const raw = Array.isArray(to) ? to : [to];
  const normalized = raw
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildTemplateContent(body: SendEmailBody): { subject: string; html: string; text: string } {
  const template = body.template;

  if (template === 'generic') {
    const subject = body.subject?.trim() ?? '';
    const html = body.html?.trim() ?? '';
    const text = body.text?.trim() ?? '';

    if (!subject) {
      throw new Error('subject is required when template is generic');
    }

    if (!html && !text) {
      throw new Error('Either html or text is required when template is generic');
    }

    return {
      subject,
      html: html || `<p>${escapeHtml(text)}</p>`,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  if (template === 'welcome') {
    const firstName = body.data?.firstName?.trim() || 'there';
    const appUrl = body.data?.appUrl?.trim() || 'https://waterways.example';

    return {
      subject: 'Welcome to Waterways',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
          <h2 style="margin-bottom:8px;">Welcome, ${escapeHtml(firstName)}!</h2>
          <p style="margin-top:0;">Your Waterways account is ready.</p>
          <p>
            <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:10px 14px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;">
              Open Waterways
            </a>
          </p>
          <p>If the button does not work, open: ${escapeHtml(appUrl)}</p>
        </div>
      `,
      text: `Welcome, ${firstName}! Your Waterways account is ready. Open Waterways: ${appUrl}`,
    };
  }

  const resetUrl = body.data?.resetUrl?.trim();

  if (!resetUrl) {
    throw new Error('data.resetUrl is required when template is password-reset');
  }

  return {
    subject: 'Reset your Waterways password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
        <h2 style="margin-bottom:8px;">Reset your password</h2>
        <p style="margin-top:0;">Use the link below to reset your password.</p>
        <p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:10px 14px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your Waterways password: ${resetUrl}`,
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    return json(500, {
      error: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL secret',
    });
  }

  let senderFrom: string;
  try {
    senderFrom = normalizeFromAddress(RESEND_FROM_EMAIL);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Invalid RESEND_FROM_EMAIL secret',
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return json(500, {
      error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variable',
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'Missing Authorization header' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: getUserError,
  } = await userClient.auth.getUser();

  if (getUserError || !user) {
    return json(401, { error: getUserError?.message ?? 'Unauthorized' });
  }

  const { data: profileData, error: profileError } = await userClient
    .from('users')
    .select('email')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Failed to read users.email for recipient fallback:', profileError.message);
  }

  const databaseEmail =
    typeof profileData?.email === 'string' && profileData.email.trim()
      ? profileData.email.trim().toLowerCase()
      : null;
  const authEmail = typeof user.email === 'string' && user.email.trim() ? user.email.trim().toLowerCase() : null;
  const canonicalUserEmail = databaseEmail ?? authEmail;

  let body: SendEmailBody;
  try {
    body = (await req.json()) as SendEmailBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body?.template) {
    return json(400, { error: 'template is required' });
  }

  const recipients = normalizeRecipients(body.to);
  if (recipients.length === 0) {
    if (!canonicalUserEmail) {
      return json(400, {
        error: 'No recipient provided and current user has no email address in public.users or auth profile',
      });
    }
    recipients.push(canonicalUserEmail);
  }

  if (recipients.some((value) => !isValidEmail(value))) {
    return json(400, { error: 'One or more recipient emails are invalid' });
  }

  if (!ALLOW_EXTERNAL_EMAIL_RECIPIENTS && canonicalUserEmail) {
    const loggedInUserEmail = canonicalUserEmail;
    const includesExternalRecipient = recipients.some((value) => value !== loggedInUserEmail);

    if (includesExternalRecipient) {
      return json(403, {
        error:
          'Sending to external recipients is disabled. Set ALLOW_EXTERNAL_EMAIL_RECIPIENTS=true to override.',
      });
    }
  }

  let built;
  try {
    built = buildTemplateContent(body);
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : 'Invalid template payload',
    });
  }

  const resendBody = {
    from: senderFrom,
    to: recipients,
    subject: built.subject,
    html: built.html,
    text: built.text,
    reply_to: body.replyTo?.trim() || undefined,
    tags: body.tags,
  };

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    });

    const resendText = await resendResponse.text();
    const resendData = resendText ? JSON.parse(resendText) : null;

    if (!resendResponse.ok) {
      return json(502, {
        error: 'Resend API request failed',
        status: resendResponse.status,
        details: resendData ?? resendText,
      });
    }

    return json(200, {
      success: true,
      emailId: resendData?.id ?? null,
      to: recipients,
      template: body.template,
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : 'Unexpected server error',
    });
  }
});
