/// @ts-nocheck

// Required environment variables:
// - SUPABASE_URL
// - SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY
//
// Request auth:
// - Requires Authorization header with a valid user session token.
//
// Behavior:
// - action=get: returns current daily summary settings from public.email.
// - action=set: updates daily_summary and updated_at for the current user.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  action: 'get' | 'set';
  dailySummary?: boolean;
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, {
      error:
        'Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY environment variable',
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

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body?.action || (body.action !== 'get' && body.action !== 'set')) {
    return json(400, { error: 'action must be either get or set' });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (body.action === 'get') {
    const { data, error } = await serviceClient
      .from('email')
      .select('daily_summary, last_daily_summary, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return json(500, { error: error.message });
    }

    return json(200, {
      dailySummary: data?.daily_summary ?? false,
      lastDailySummary: data?.last_daily_summary ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  }

  if (typeof body.dailySummary !== 'boolean') {
    return json(400, { error: 'dailySummary must be a boolean when action is set' });
  }

  const { data, error } = await serviceClient
    .from('email')
    .upsert(
      {
        user_id: user.id,
        daily_summary: body.dailySummary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('daily_summary, last_daily_summary, updated_at')
    .single();

  if (error) {
    return json(500, { error: error.message });
  }

  return json(200, {
    dailySummary: data.daily_summary,
    lastDailySummary: data.last_daily_summary,
    updatedAt: data.updated_at,
  });
});
