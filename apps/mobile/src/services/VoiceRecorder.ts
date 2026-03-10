import { getDatabase } from '../database/db';
import { createObservation, updateObservationById } from '../database/ObservationManager';
import { SyncStatus } from '../database/SyncStatus';
import * as FileSystem from 'expo-file-system/legacy';

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Save a recorded audio file as an observation + observation_media row
 * for the given trip and user.
 *
 * Returns the observation ID so the caller can start a camera window.
 *
 * IMPORTANT: Copies the audio file from the recorder's temp cache to permanent storage
 * to prevent recordings from being overwritten by subsequent recordings.
 */
export const saveAudioObservationForTrip = async (
  tripId: string,
  userId: string,
  uri: string
): Promise<string | null> => {
  try {
    if (!uri) {
      console.warn('[VoiceRecorder] No URI provided to saveAudioObservationForTrip');
      return null;
    }

    // 1) Create observation row (no text yet)
    const observationId = await createObservation({
      user_id: userId,
      trip_id: tripId,
      observation: null,
      audio_media_id: null,
      audio_transcribed: false,
    });

    // 2) Copy audio file to permanent storage
    // The recorder puts files in a temp cache that gets overwritten,
    // so we need to copy each recording to a unique permanent location
    const fileName = `audio_${observationId}_${Date.now()}.m4a`;
    const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.copyAsync({
      from: uri,
      to: permanentUri,
    });

    console.log('[VoiceRecorder] Copied audio from temp cache to permanent storage:', permanentUri);

    // Get file size from the permanent location
    const info = await FileSystem.getInfoAsync(permanentUri);
    const fileSize = info.exists && 'size' in info ? info.size : null;

    // 3) Insert into observation_media with permanent URI
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
      [mediaId, now, observationId, permanentUri, 'audio', fileSize, SyncStatus.PENDING, 0]
    );

    // 4) Link the observation to this media
    await updateObservationById(observationId, {
      audio_media_id: mediaId,
      audio_transcribed: false,
    });

    console.log(
      '[VoiceRecorder] Saved audio observation',
      observationId,
      'media',
      mediaId,
      'permanent uri',
      permanentUri
    );

    // Return the observation ID for camera window
    return observationId;
  } catch (err) {
    console.error('[VoiceRecorder] Failed to save audio observation', err);
    return null;
  }
};
