import { supabase } from '@waterways/shared/src/supabase/client';
import { getDatabase } from '../database/db';
import { updateObservationById } from '../database/ObservationManager';
import * as LegacyFS from 'expo-file-system/legacy';

type TranscriptionResponse = {
  text?: string;
};

export type UntranscribedAudioRow = {
  observation_id: string;
  // can be null in your query / tests
  local_file_path: string | null;
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
 * Check if the transcription is a Whisper default response (no actual speech).
 * Whisper returns these generic phrases when there's silence or no detectable speech.
 */
function isWhisperDefaultResponse(text: string): boolean {
  // Normalize: lowercase and remove punctuation for flexible matching
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[.,!?]/g, '');

  // Common Whisper default responses when no speech is detected (English only)
  const defaults = [
    'thanks for watching',
    'thank you for watching',
    'subscribe',
    'like and subscribe',
    'please subscribe',
    'thank you',
    '', // Empty string
  ];

  return defaults.includes(normalized);
}

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

      // Use legacy readAsStringAsync
      const base64 = await LegacyFS.readAsStringAsync(local_file_path, {
        encoding: 'base64',
      });

      const filename = local_file_path.split('/').pop() ?? 'audio.m4a';
      const mimeType = guessMimeType(local_file_path);

      const { data, error } = await supabase.functions.invoke<TranscriptionResponse>(
        'transcribe-audio',
        {
          body: {
            audioBase64: base64,
            filename,
            mimeType,
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

      const rawTranscript = (data?.text ?? '').trim();

      // FIXED: Replace Whisper default responses with "No speech detected"
      const transcript = isWhisperDefaultResponse(rawTranscript)
        ? 'No speech detected'
        : rawTranscript;

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
