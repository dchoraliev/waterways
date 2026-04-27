/// @ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase environment variables' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const requestBody = await req.json().catch(() => ({}));
    const body =
      requestBody && typeof requestBody === 'object'
        ? (requestBody as Record<string, unknown>)
        : {};
    const action = typeof body.action === 'string' ? body.action : '';

    if (action !== 'confirm-anonymize') {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Use confirm-anonymize to anonymize observations.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: getUserError,
    } = await userClient.auth.getUser();

    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: getUserError?.message ?? 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: observations, error: fetchObservationsError } = await adminClient
      .from('observations')
      .select('id')
      .eq('user_id', user.id);

    if (fetchObservationsError) {
      return new Response(JSON.stringify({ error: fetchObservationsError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const rows = Array.isArray(observations) ? observations : [];
    let updatedCount = 0;

    for (const row of rows) {
      const observationId = typeof row?.id === 'string' ? row.id : null;
      if (!observationId) {
        continue;
      }

      const anonymizedObservationId = `anon-observation-${observationId}`;

      const { error: updateObservationError } = await adminClient
        .from('observations')
        .update({
          user_id: null,
          trip_id: null,
          unique_userID_localID_pair: anonymizedObservationId,
        })
        .eq('id', observationId);

      if (updateObservationError) {
        return new Response(
          JSON.stringify({
            error: `Failed to anonymize observation ${observationId}: ${updateObservationError.message}`,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      updatedCount += 1;
    }

    return new Response(
      JSON.stringify({
        success: true,
        anonymizedCount: updatedCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
