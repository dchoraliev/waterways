import { getDatabase } from '../database/db';
import { addMedia } from '../database/MediaManager';
import { updateObservationById } from '../database/ObservationManager';

type AttachParams = {
  observationId: string;
  localUri: string;
  type: 'photo' | 'video';
  fileSize?: number | null;
};

/**
 * Check if an observation already has a photo or video attached.
 *
 * @param observationId - The observation ID to check
 * @returns Promise<boolean> - true if observation has media, false otherwise
 */
export async function observationHasMedia(observationId: string): Promise<boolean> {
  const db = await getDatabase();

  if (!db) {
    console.error('[CameraMediaService] Database not initialized');
    return false;
  }

  const existingMedia = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM observation_media 
     WHERE observation_id = ? 
     AND media_type IN ('image', 'video')`,
    [observationId]
  );

  return !!(existingMedia && existingMedia.length > 0);
}

/**
 * Attach a local media file to an observation by inserting a row into observation_media.
 *
 *  ENFORCES ONE MEDIA PER OBSERVATION:
 * - Checks if observation already has a photo or video
 * - Throws error if media already exists
 * - Only allows one photo OR one video per observation
 *
 * Media is optional: observations can exist without media.
 */
export async function attachLocalMediaToObservation({
  observationId,
  localUri,
  type,
  fileSize = null,
}: AttachParams) {
  // CHECK: Does observation already have media?
  const hasMedia = await observationHasMedia(observationId);

  if (hasMedia) {
    console.error('[CameraMediaService] Observation already has media:', observationId);
    throw new Error('This observation already has a photo or video attached.');
  }

  const mediaType = type === 'photo' ? 'image' : 'video';

  const media = await addMedia({
    observation_id: observationId,
    local_file_path: localUri,
    media_type: mediaType,
    file_size: fileSize,
  });

  await updateObservationById(observationId, { local_media_id: media.id });

  console.log('[CameraMediaService] Media attached to observation:', {
    observationId,
    mediaId: media.id,
    type: mediaType,
  });

  return media;
}
