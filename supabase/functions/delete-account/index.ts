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
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';

    if (action !== 'confirm-delete') {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Use confirm-delete to delete an account.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!currentPassword.trim()) {
      return new Response(JSON.stringify({ error: 'Current password is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
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

    if (!user.email) {
      return new Response(
        JSON.stringify({ error: 'Authenticated user does not have an email address.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Verify password before deleting anything.
    const { error: verifyPasswordError } = await userClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyPasswordError) {
      return new Response(
        JSON.stringify({
          error: `Current password is invalid: ${verifyPasswordError.message}`,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    /**
     * Step 1:
     * Delete user's audio files from Storage.
     */
    const { data: audioRecordings, error: audioFetchError } = await adminClient
      .from('audio_recordings')
      .select('id, bucket, file_path')
      .eq('user_id', user.id);

    if (audioFetchError) {
      return new Response(
        JSON.stringify({
          error: `Unable to fetch audio recordings: ${audioFetchError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const audioRows = Array.isArray(audioRecordings) ? audioRecordings : [];
    const filesByBucket = new Map<string, string[]>();

    for (const recording of audioRows) {
      const bucket =
        typeof recording?.bucket === 'string' && recording.bucket.trim()
          ? recording.bucket
          : 'Audios';

      const filePath =
        typeof recording?.file_path === 'string' && recording.file_path.trim()
          ? recording.file_path
          : null;

      if (!filePath) {
        continue;
      }

      if (!filesByBucket.has(bucket)) {
        filesByBucket.set(bucket, []);
      }

      filesByBucket.get(bucket)?.push(filePath);
    }

    let deletedAudioFileCount = 0;

    for (const [bucket, paths] of filesByBucket.entries()) {
      if (paths.length === 0) {
        continue;
      }

      const { data: removedFiles, error: storageDeleteError } = await adminClient.storage
        .from(bucket)
        .remove(paths);

      if (storageDeleteError) {
        return new Response(
          JSON.stringify({
            error: `Unable to delete audio files from ${bucket}: ${storageDeleteError.message}`,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      deletedAudioFileCount += removedFiles?.length ?? paths.length;
    }

    /**
     * Step 2:
     * Delete audio metadata rows.
     */
    const { error: audioRowsDeleteError, count: deletedAudioRowCount } = await adminClient
      .from('audio_recordings')
      .delete({ count: 'exact' })
      .eq('user_id', user.id);

    if (audioRowsDeleteError) {
      return new Response(
        JSON.stringify({
          error: `Unable to delete audio recording metadata: ${audioRowsDeleteError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    /**
     * Step 3:
     * Anonymize observations.
     */
    const { data: observations, error: fetchObservationsError } = await adminClient
      .from('observations')
      .select('id')
      .eq('user_id', user.id);

    if (fetchObservationsError) {
      return new Response(
        JSON.stringify({
          error: `Unable to fetch observations: ${fetchObservationsError.message}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const observationRows = Array.isArray(observations) ? observations : [];
    let anonymizedCount = 0;

    for (const row of observationRows) {
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
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      anonymizedCount += 1;
    }

    /**
     * Step 4:
     * Delete auth user last.
     *
     * This should also cascade-delete rows in public.users if that table
     * references auth.users(id) on delete cascade.
     */
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id, false);

    if (deleteUserError) {
      return new Response(JSON.stringify({ error: deleteUserError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedAudioFiles: deletedAudioFileCount,
        deletedAudioRows: deletedAudioRowCount ?? audioRows.length,
        anonymizedObservations: anonymizedCount,
        deletedAuthUser: true,
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
