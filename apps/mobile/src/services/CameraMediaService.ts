import { addMedia } from '../database/MediaManager';

type AttachParams = {
  observationId: string;
  localUri: string;
  type: 'photo' | 'video';
  fileSize?: number | null;
};

/**
 * Attach a local media file to an observation by inserting a row into observation_media.
 * Media is optional: observations can exist without media.
 */
export async function attachLocalMediaToObservation({
  observationId,
  localUri,
  type,
  fileSize = null,
}: AttachParams) {
  const mediaType = type === 'photo' ? 'image' : 'video';

  return addMedia({
    observation_id: observationId,
    local_file_path: localUri,
    media_type: mediaType,
    file_size: fileSize,
  });
}
