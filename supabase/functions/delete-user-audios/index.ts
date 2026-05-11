/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AudioRecording = {
  id: string;
  bucket: string | null;
  file_path: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      },
      500
    );
  }

  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const requestBody = await req.json().catch(() => ({}));

  const body =
    requestBody && typeof requestBody === 'object' ? (requestBody as Record<string, unknown>) : {};

  const action = typeof body.action === 'string' ? body.action : '';

  if (action !== 'confirm-delete-user-audio') {
    return jsonResponse(
      {
        error: `Invalid action. Use confirm-delete-user-audio to delete user audio data.`,
      },
      400
    );
  }

  const jwt = authHeader.replace('Bearer ', '');

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (userError || !user) {
    return jsonResponse(
      {
        error: userError?.message ?? 'Invalid user token',
      },
      401
    );
  }

  const userId = user.id;

  const { data: recordings, error: fetchError } = await supabaseAdmin
    .from('audio_recordings')
    .select('id, bucket, file_path')
    .eq('user_id', userId);

  if (fetchError) {
    return jsonResponse(
      {
        error: fetchError.message,
      },
      500
    );
  }

  const audioRecordings = (recordings ?? []) as AudioRecording[];

  if (audioRecordings.length === 0) {
    const result = {
      userId,
      recordingsFound: 0,
      storageDeleted: 0,
      rowsDeleted: 0,
      message: 'No audio recordings found for user.',
    };

    console.log('delete-user-audios result:', result);

    return jsonResponse(result, 200);
  }

  const errors: Array<{
    step: string;
    bucket?: string;
    file_path?: string;
    error: string;
  }> = [];

  let storageDeleted = 0;

  const filesByBucket = new Map<string, string[]>();

  for (const recording of audioRecordings) {
    const bucket = recording.bucket || 'Audios';

    if (!recording.file_path) {
      errors.push({
        step: 'file_path_validation',
        bucket,
        error: `Missing file_path for audio recording ${recording.id}`,
      });

      continue;
    }

    if (!filesByBucket.has(bucket)) {
      filesByBucket.set(bucket, []);
    }

    filesByBucket.get(bucket)?.push(recording.file_path);
  }

  for (const [bucket, paths] of filesByBucket.entries()) {
    if (paths.length === 0) {
      continue;
    }

    const { data: removedFiles, error: storageError } = await supabaseAdmin.storage
      .from(bucket)
      .remove(paths);

    if (storageError) {
      errors.push({
        step: 'storage_delete',
        bucket,
        error: storageError.message,
      });

      continue;
    }

    storageDeleted += removedFiles?.length ?? paths.length;
  }

  const { error: deleteRowsError, count } = await supabaseAdmin
    .from('audio_recordings')
    .delete({ count: 'exact' })
    .eq('user_id', userId);

  if (deleteRowsError) {
    errors.push({
      step: 'database_delete',
      error: deleteRowsError.message,
    });
  }

  const result = {
    userId,
    recordingsFound: audioRecordings.length,
    storageDeleted,
    rowsDeleted: count ?? 0,
    errors,
  };

  console.log('delete-user-audios result:', result);

  return jsonResponse(result, errors.length > 0 ? 207 : 200);
});
