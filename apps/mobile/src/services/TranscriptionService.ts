// apps/mobile/src/services/TranscriptionService.ts

import { File } from 'expo-file-system';
import { supabase } from '@shared/supabase/client';
import { getDatabase } from '../database/db';
import { updateObservationById } from '../database/ObservationManager';

type TranscriptionResponse = {
  text?: string;
};

type UntranscribedAudioRow = {
  observation_id: string;
  local_file_path: string;
};

/**
 * Guess a mime type from file extension.
 */
function guessMimeType(path: string): string {
  const filename = path.split('/').pop() ?? '';
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/m4a';
    case 'aac':
      return 'audio/aac';
    case 'ogg':
      return 'audio/ogg';
    case 'mp3':
    default:
      return 'audio/mpeg';
  }
}

/**
 * Transcribe all untranscribed audio clips for a given trip.
 */
export async function transcribeTripAudio(tripId: string): Promise<void> {
  const db = await getDatabase();

  const rows = await db!.getAllAsync<UntranscribedAudioRow>(
    `
    SELECT
      o.id AS observation_id,
      m.local_file_path AS local_file_path
    FROM observations o
    JOIN observation_media m ON m.id = o.audio_media_id
    WHERE
      o.trip_id = ?
      AND o.audio_media_id IS NOT NULL
      AND o.audio_transcribed = 0
    ORDER BY o.created_at ASC
    `,
    [tripId]
  );

  if (!rows || rows.length === 0) {
    console.log('[TranscriptionService] No untranscribed audio for trip', tripId);
    return;
  }

  console.log(
    `[TranscriptionService] Found ${rows.length} audio clip(s) for trip ${tripId} to transcribe`
  );

  for (const row of rows) {
    const { observation_id, local_file_path } = row;

    try {
      if (!local_file_path) {
        console.warn(
          '[TranscriptionService] Missing local_file_path for observation',
          observation_id
        );
        continue;
      }

      // ⚠️ NEW API: use File + base64(), no deprecated legacy calls.
      // local_file_path is a "file://..." URI saved from the recorder.
      const file = new File(local_file_path);
      const base64 = await file.base64(); // Promise<string>

      const filename = local_file_path.split('/').pop() ?? 'audio.m4a';
      const mimeType = guessMimeType(local_file_path);

      const { data, error } = await supabase.functions.invoke<TranscriptionResponse>(
        'transcribe-audio',
        {
          body: {
            audioBase64: base64,
            filename,
            mimeType,
            // language: 'en', // optional – your edge function has a default
          },
        }
      );

      if (error) {
        console.error(
          '[TranscriptionService] Whisper transcription error for observation',
          observation_id,
          error
        );
        continue;
      }

      const transcript = (data?.text ?? '').trim();

      console.log(
        `[TranscriptionService] Got transcript for observation ${observation_id}:`,
        transcript.slice(0, 80)
      );

      await updateObservationById(observation_id, {
        observation: transcript,
        audio_transcribed: true,
      });
    } catch (err) {
      console.error('[TranscriptionService] Failed to transcribe observation', observation_id, err);
    }
  }
}
