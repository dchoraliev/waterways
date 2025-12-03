import { getDatabase } from '../database/db';
import { createObservation, updateObservationById } from '../database/ObservationManager';
import { SyncStatus } from '../database/SyncManager';

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Save a recorded audio file as an observation + observation_media row
 * for the given trip and user.
 *
 * NOTE:
 * - We no longer call FileSystem.getInfoAsync (deprecated / throws in SDK 54).
 * - We assume the URI we got from the recorder is valid.
 */
export const saveAudioObservationForTrip = async (
  tripId: string,
  userId: string,
  uri: string
): Promise<void> => {
  try {
    if (!uri) {
      console.warn('[VoiceRecorder] No URI provided to saveAudioObservationForTrip');
      return;
    }

    // If you really want to validate, you could use the new File API later.
    // For now we skip size/existence checks to avoid legacy API.
    const fileSize: number | null = null;

    // 1) Create observation row (no text yet)
    const observationId = await createObservation({
      user_id: userId,
      trip_id: tripId,
      observation: null,
      audio_media_id: null,
      audio_transcribed: false,
      sync_status: SyncStatus.PENDING,
    });

    // 2) Insert into observation_media
    const db = await getDatabase();
    const mediaId = makeId('media');
    const now = Date.now();

    await db!.runAsync(
      `INSERT OR REPLACE INTO observation_media (
        id,
        created_at,
        observation_id,
        local_file_path,
        media_type,
        file_size,
        sync_status,
        last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [mediaId, now, observationId, uri, 'audio', fileSize, SyncStatus.PENDING, 0]
    );

    // 3) Link the observation to this media
    await updateObservationById(observationId, {
      audio_media_id: mediaId,
      audio_transcribed: false,
    });

    console.log(
      '[VoiceRecorder] Saved audio observation',
      observationId,
      'media',
      mediaId,
      'uri',
      uri
    );
  } catch (err) {
    console.error('[VoiceRecorder] Failed to save audio observation', err);
  }
};
