// supabase/functions/delete-expired-audios/index.ts
/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: expiredRecordings, error: fetchError } = await supabase
    .from('audio_recordings')
    .select('id, bucket, file_path')
    .lte('scheduled_deletion', new Date().toISOString());

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!expiredRecordings || expiredRecordings.length === 0) {
    return new Response(
      JSON.stringify({
        deleted: 0,
        message: 'No expired audio recordings found.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let deletedCount = 0;
  const errors: Array<{
    id: string;
    file_path: string;
    error: string;
  }> = [];

  for (const recording of expiredRecordings) {
    const bucket = recording.bucket || 'Audios';

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([recording.file_path]);

    if (storageError) {
      errors.push({
        id: recording.id,
        file_path: recording.file_path,
        error: storageError.message,
      });

      continue;
    }

    const { error: dbDeleteError } = await supabase
      .from('audio_recordings')
      .delete()
      .eq('id', recording.id);

    if (dbDeleteError) {
      errors.push({
        id: recording.id,
        file_path: recording.file_path,
        error: dbDeleteError.message,
      });

      continue;
    }

    deletedCount++;
  }

  console.log('delete-expired-audios result:', {
    deleted: deletedCount,
    errors,
  });

  return new Response(
    JSON.stringify({
      deleted: deletedCount,
      errors,
    }),
    {
      status: errors.length > 0 ? 207 : 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
