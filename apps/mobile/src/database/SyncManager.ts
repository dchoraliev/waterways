import { supabase } from '@waterways/shared/src/supabase/client';
import { getTripById, getTripsBySyncStatus, updateTripById } from './TripManager';
import { getObservationsByTripId, updateObservationById } from './ObservationManager';

import { getMediaById, updateMediaById } from './MediaManager';
import { SyncStatus } from './SyncStatus';

const IMAGE_BUCKET = 'Images';
const VIDEO_BUCKET = 'Vidoes';
const AUDIO_BUCKET = 'Audios';
let observationMediaUpsertAvailable = true;

function getMediaBucketName(mediaType: string | null | undefined): string {
  if (mediaType === 'audio') return AUDIO_BUCKET;
  if (mediaType === 'video') return VIDEO_BUCKET;
  return IMAGE_BUCKET;
}

function getMediaFileExtension(mediaType: string | null | undefined): string {
  if (mediaType === 'video') return 'mp4';
  if (mediaType === 'audio') return 'm4a';
  return 'jpg';
}

function getMediaContentType(mediaType: string | null | undefined): string {
  if (mediaType === 'video') return 'video/mp4';
  if (mediaType === 'audio') return 'audio/m4a';
  return 'image/jpg';
}

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleaned = base64.replace(/[^A-Za-z0-9+/=]/g, '');

  const output: number[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    const e1 = chars.indexOf(cleaned.charAt(i));
    const e2 = chars.indexOf(cleaned.charAt(i + 1));
    const c3 = cleaned.charAt(i + 2);
    const c4 = cleaned.charAt(i + 3);
    const e3 = c3 === '=' ? 64 : chars.indexOf(c3);
    const e4 = c4 === '=' ? 64 : chars.indexOf(c4);

    const b1 = (e1 << 2) | (e2 >> 4);
    output.push(b1 & 0xff);

    if (e3 !== 64) {
      const b2 = ((e2 & 15) << 4) | (e3 >> 2);
      output.push(b2 & 0xff);
    }

    if (e4 !== 64) {
      const b3 = ((e3 & 3) << 6) | e4;
      output.push(b3 & 0xff);
    }
  }

  return Uint8Array.from(output).buffer;
}

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const fetchFn = (
    globalThis as unknown as {
      fetch?: (
        input: string
      ) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer> }>;
    }
  ).fetch;

  if (fetchFn) {
    try {
      const response = await fetchFn(uri);
      if (response.ok) {
        return response.arrayBuffer();
      }
    } catch {
      // Fall through to file-system fallback
    }
  }

  const fsModule = await import('expo-file-system/legacy');

  // CRITICAL FIX: Check if file exists before trying to read it
  const fileInfo = await fsModule.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error(`File does not exist: ${uri}`);
  }
  if (!fileInfo.isDirectory && fileInfo.size === 0) {
    throw new Error(`File is empty: ${uri}`);
  }

  // Read file as base64
  const base64 = await fsModule.readAsStringAsync(uri, {
    encoding: fsModule.EncodingType.Base64,
  });

  return decodeBase64ToArrayBuffer(base64);
}

export { SyncStatus };

/**
 * @param tripId
 */
async function _logSyncStatus(
  _table_name: string,
  _record_id: string,
  _status: SyncStatus,
  _error_message?: string
): Promise<void> {}

/**
 * Safely converts a string, number, or Date into an ISO 8601 timestamp.
 * Returns `undefined` if the value is empty, invalid, or cannot be parsed as a date.
 */
export const parseDateTime = (v: string | number | Date | null | undefined): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Converts longitude + latitude values into an EWKT POINT string.
 * Returns `undefined` if either value is missing or invalid.
 *
 * Example output:
 *   "SRID=4326;POINT(-90.123 42.456)"
 */
export const parseLocationAsEWKT = (
  lon: string | number | null | undefined,
  lat: string | number | null | undefined,
  srid: number = 4326
): string | undefined => {
  // Internal helper used only for coordinate parsing
  const toNum = (v: string | number | null | undefined): number | undefined => {
    if (v === undefined || v === null || v === '') return undefined;

    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };

  const LON = toNum(lon);
  const LAT = toNum(lat);

  if (LON === undefined || LAT === undefined) return undefined;

  return `SRID=${srid};POINT(${LON} ${LAT})`;
};

export async function syncAllReviewedTrips(): Promise<void> {
  // Get all trips with pending sync status
  const pendingTrips = await getTripsBySyncStatus(SyncStatus.REVIEWED);
  console.log(`[SyncManager] Found ${pendingTrips.length} submitted trips with pending sync.`);
  for (const trip of pendingTrips) {
    try {
      console.log(`[SyncManager] Syncing trip ${trip.id}...`);
      await syncTrip(trip.id);
    } catch (error) {
      console.error(`[SyncManager] Error syncing trip ${trip.id}:`, error);
    }
  }
}

export async function syncAllFailedTrips(): Promise<void> {
  // Get all trips with error sync status
  const failedTrips = await getTripsBySyncStatus(SyncStatus.ERROR);
  console.log(`[SyncManager] Found ${failedTrips.length} trips with failed sync.`);
  for (const trip of failedTrips) {
    try {
      console.log(`[SyncManager] Retrying sync for trip ${trip.id}...`);
      await syncTrip(trip.id);
    } catch (error) {
      console.error(`[SyncManager] Error retrying sync for trip ${trip.id}:`, error);
    }
  }
}

/**
 * Sync a trip → observations → multimedia.
 */
export async function syncTrip(tripId: string): Promise<void> {
  // Sync the trip to receive the supabase trip id
  const tripRecord = await getTripById(tripId);

  let supabaseTripId: string = '';
  if (tripRecord) {
    const payload = {
      unique_userID_localID_pair: tripRecord.user_id + '-' + tripRecord.id,
      user_id: tripRecord.user_id,
      project_id: tripRecord.project_id,
      created_at: parseDateTime(tripRecord.created_at),
      start_time: parseDateTime(tripRecord.start_time),
      end_time: parseDateTime(tripRecord.end_time),
      start_location: parseLocationAsEWKT(tripRecord.start_longitude, tripRecord.start_latitude),
      end_location: parseLocationAsEWKT(tripRecord.end_longitude, tripRecord.end_latitude),
    };
    console.log('[SyncManager] Preparing to sync trip - ', payload);
    const { data, error } = await supabase
      .from('trips')
      .upsert(payload, { onConflict: 'unique_userID_localID_pair' })
      .select('id')
      .single();

    if (data) {
      // Trip sync succesful, update the record with the new supabase id
      supabaseTripId = data.id;
      await updateTripById(tripId, { supabase_id: supabaseTripId });

      // Sync the trip observations now
      const success = await syncObservations(tripId, supabaseTripId);
      if (success) {
        // All the trip observation synced successful, resolved the trip to be synced.
        console.log(`[SyncManager] Trip synced - ${tripId}`);
        await updateTripById(tripId, {
          sync_status: SyncStatus.SYNCED,
          last_synced_at: Date.now(),
        });
      } else {
        // Block the trip sync due to observation sync failure
        console.error(
          `[SyncManager] Sync blocked for trip ${tripId} due to failed observations upload`
        );
        await updateTripById(tripId, { sync_status: SyncStatus.ERROR });
      }
    } else {
      // Error occured during trip sync
      console.error(`[SyncManager] Sync failed for Trip ${tripId} due to unknown error: `, error);
      await updateTripById(tripId, { sync_status: SyncStatus.ERROR });
    }
  }
}

/**
 * Sync all observations for a given trip.
 */
async function syncObservations(tripId: string, supabaseTripId: string): Promise<boolean> {
  // Get all observations for the trip
  const observations = await getObservationsByTripId(tripId);
  console.log(`[SyncManager] Syncing ${observations.length} observations for trip ${tripId}`);
  let failure_encountered = false;

  // Check if the received supabase_id is a valid uuid to trust it (must be 36 length)
  if (!supabaseTripId || supabaseTripId.length !== 36) {
    // Mark each obs failed sync, because the supabase trip id is invalid
    console.error(
      `[SyncManager] Sync observations for trip ID ${tripId} failed: Invalid supabase trip id was provided.`
    );
    for (const obs of observations) {
      await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
    }
    return false;
  }

  // Update the trip id and sync the observation as well as the media.
  console.warn(
    `[SyncManager] Updating the observations trip ID from ${tripId} to supabase trip ID ${supabaseTripId}`
  );
  for (const obs of observations) {
    await updateObservationById(obs.id, { supabase_trip_id: supabaseTripId });

    let upload_failed = false;
    let observationMediaUrls: string[] | null = null;
    let recordingId: string | null = null;

    // Observation audio is synced first. Each observation has its own audio_media_id.
    const audioMediaId = (obs as unknown as { audio_media_id?: string | null }).audio_media_id;
    if (audioMediaId) {
      const audioMedia = await getMediaById(audioMediaId);

      if (audioMedia?.media_type === 'audio') {
        const { success, audioRecordingId } = await syncAudioMedia(audioMediaId, obs.user_id);
        if (success && audioRecordingId) {
          recordingId = audioRecordingId;
          await updateObservationById(obs.id, { supabase_audio_media_id: audioRecordingId });
        } else {
          console.warn(
            `[SyncManager] Audio upload failed for observation ${obs.id}, syncing observation without audio`
          );
          upload_failed = true;
        }
      } else {
        console.warn(
          `[SyncManager] Audio media ${audioMediaId} for observation ${obs.id} was not found or is not audio`
        );
        upload_failed = true;
      }
    }

    // Observation has an additional local media file which needs to be uploaded after audio
    if (obs.local_media_id) {
      const { success, url } = await syncMedia(obs.local_media_id);
      if (success && url) {
        // Update the observation with the new multimedia URL
        await updateObservationById(obs.id, { multimedia_url: url });
        observationMediaUrls = [url];
      } else {
        // FIXED: Media upload failed, but we'll still sync the observation without media
        // This prevents one corrupted/missing media file from blocking the entire trip
        console.warn(
          `[SyncManager] Media upload failed for observation ${obs.id}, syncing observation without media`
        );
        upload_failed = true;
        // Media is already marked as ERROR in syncMedia, so no need to update it here
      }
    }

    // FIXED: Always sync the observation, even if media upload failed
    // Upload the observation
    const payload = {
      unique_userID_localID_pair: obs.user_id + '-' + obs.id,
      user_id: obs.user_id,
      trip_id: supabaseTripId,
      created_at: parseDateTime(obs.created_at),
      location: parseLocationAsEWKT(obs.longitude, obs.latitude),
      observation: obs.observation ?? undefined,
      categories: obs.category_id ? [obs.category_id] : null,
      observation_media: observationMediaUrls, // Will be null if media failed
      audio_recording_id: recordingId,
    };
    console.log(`[SyncManager] Preparing to sync observation - `, payload);
    const { error } = await supabase
      .from('observations')
      .upsert(payload, { onConflict: 'unique_userID_localID_pair' });

    if (error) {
      // Error encountered during observation sync
      failure_encountered = true;
      console.error(
        `[SyncManager] Sync failed for observation id ${obs.id} due to unknown error: `,
        error
      );
      await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
    } else {
      // Update the sync status on success
      if (upload_failed) {
        console.log(`[SyncManager] Observation synced (without media) - ${obs.id}`);
      } else {
        console.log(`[SyncManager] Observation synced (with media) - ${obs.id}`);
      }
      await updateObservationById(obs.id, {
        sync_status: SyncStatus.SYNCED,
        last_synced_at: Date.now(),
      });
    }
  }

  // Return if all the observations are succesfully uploaded or if any failures were seen.
  return !failure_encountered;
}

/**
 * Uplaod audio media for a single observation in private bucket.
 */
async function syncAudioMedia(
  mediaId: string,
  userId?: string
): Promise<{ success: boolean; audioRecordingId: string | null }> {
  const media = await getMediaById(mediaId);
  if (!media) {
    console.error(`[SyncManager] Sync failed: media ${mediaId} was not found in local database`);
    return { success: false, audioRecordingId: null };
  }
  if (media.media_type !== 'audio') {
    console.error(`[SyncManager] Sync failed: media ${mediaId} is not audio`);
    return { success: false, audioRecordingId: null };
  }

  const ownerUserId = userId;
  if (!ownerUserId) {
    console.error(
      `[SyncManager] Sync failed: user_id is required to upload audio ${mediaId} into user folder`
    );
    await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
    return { success: false, audioRecordingId: null };
  }

  try {
    const bucket = getMediaBucketName(media.media_type);
    const extension = getMediaFileExtension(media.media_type);
    const contentType = getMediaContentType(media.media_type);
    const fileBuffer = await readFileAsArrayBuffer(media.local_file_path);
    const byteLength = fileBuffer.byteLength;
    let supabaseAudioRecordingId: string = '';

    console.log(`[SyncManager] Creating audio recording row entry for ${media.id}`);
    const { data: audioRowData, error: audioRowError } = await supabase
      .from('audio_recordings')
      .upsert(
        {
          user_id: ownerUserId,
          mime_type: contentType,
          size_bytes: byteLength,
          unique_userID_localID_pair: ownerUserId + '-' + media.id,
        },
        { onConflict: 'unique_userID_localID_pair' }
      )
      .select('id')
      .single();
    if (audioRowData) {
      supabaseAudioRecordingId = audioRowData.id;
      console.log(`[SyncManager] Audio recording created: ${supabaseAudioRecordingId}`);
    }
    if (audioRowError) {
      console.error(`[SyncManager] Audio_recordings upsert failed for ${mediaId}:`, audioRowError);
      await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
      return { success: false, audioRecordingId: null };
    }

    const path = `${ownerUserId}/${supabaseAudioRecordingId}.${extension}`;

    console.log(
      `[SyncManager] Uploading audio file ${media.id} to bucket=${bucket} at path=${path}`
    );
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });
    if (uploadError) {
      console.error(
        `[SyncManager] Sync failed: Audio file upload error for media ${mediaId}`,
        uploadError
      );
      await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
      return { success: false, audioRecordingId: null };
    }

    // Audio file upload was successful
    const { error: updateError } = await supabase
      .from('audio_recordings')
      .update({ file_name: supabaseAudioRecordingId, file_path: path })
      .eq('id', supabaseAudioRecordingId);
    if (updateError) {
      console.error(
        `[SyncManager] Sync failed: Audio recording row update error for ${mediaId}`,
        updateError
      );
      await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
      return { success: false, audioRecordingId: null };
    }

    console.log(`[SyncManager] Audio file and recording row uploaded successfully for ${media.id}`);
    await updateMediaById(mediaId, {
      sync_status: SyncStatus.SYNCED,
      last_synced_at: Date.now(),
    });

    return { success: true, audioRecordingId: supabaseAudioRecordingId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes('File does not exist') ||
      errorMessage.includes('is not readable') ||
      errorMessage.includes('is empty')
    ) {
      console.warn(
        `[SyncManager] Audio file missing or unreadable (will sync observation without audio):`,
        `Media ID: ${mediaId}`,
        `Path: ${media.local_file_path}`
      );
    } else {
      console.error(`[SyncManager] Unexpected error while uploading audio ${mediaId}:`, error);
    }

    await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
    return { success: false, audioRecordingId: null };
  }
}
/**
 * Upload media for a single observation.
 */
async function syncMedia(mediaId: string): Promise<{ success: boolean; url: string | null }> {
  const media = await getMediaById(mediaId);
  if (!media) {
    console.error(`[SyncManager] Sync failed: media ${mediaId} was not found in local database`);
    return { success: false, url: null };
  }

  try {
    const bucket = getMediaBucketName(media.media_type);
    const extension = getMediaFileExtension(media.media_type);
    const contentType = getMediaContentType(media.media_type);
    const path = `${media.observation_id}/${media.id}.${extension}`;
    console.log(
      `[SyncManager] Uploading media ${media.id} type=${media.media_type ?? 'unknown'} bucket=${bucket} path=${path}`
    );
    const fileBuffer = await readFileAsArrayBuffer(media.local_file_path);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      console.error(`[SyncManager] Sync failed: upload error for media ${mediaId}`, uploadError);
      await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
      return { success: false, url: null };
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = publicData.publicUrl || null;

    if (observationMediaUpsertAvailable) {
      const supabaseUntyped = supabase as unknown as {
        from: (table: string) => { upsert: (payload: unknown) => Promise<{ error: unknown }> };
      };

      const { error: mediaRowError } = await supabaseUntyped.from('observation_media').upsert({
        id: media.id,
        observation_id: media.observation_id,
        media_url: publicUrl ?? path,
        media_type: media.media_type === 'video' ? 'video' : 'image',
        created_at: parseDateTime(media.created_at),
      });

      if (mediaRowError) {
        const code = (mediaRowError as { code?: string })?.code;
        if (code === 'PGRST205') {
          observationMediaUpsertAvailable = false;
          console.log(
            '[SyncManager] public.observation_media is unavailable in this Supabase schema. Skipping that upsert going forward.'
          );
        } else {
          console.warn(
            `[SyncManager] Media uploaded successfully, but observation_media upsert failed for ${mediaId}. Continuing.`
          );
          console.warn(mediaRowError);
        }
      }
    }

    await updateMediaById(mediaId, {
      sync_status: SyncStatus.SYNCED,
      last_synced_at: Date.now(),
    });

    return { success: true, url: publicUrl ?? path };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a file not found error - these are handled gracefully
    if (
      errorMessage.includes('File does not exist') ||
      errorMessage.includes('is not readable') ||
      errorMessage.includes('is empty')
    ) {
      console.warn(
        `[SyncManager] Media file missing or unreadable (will sync observation without media):`,
        `Media ID: ${mediaId}`,
        `Path: ${media.local_file_path}`
      );
    } else {
      // Unexpected errors should still be logged as errors
      console.error(`[SyncManager] Unexpected error while uploading media ${mediaId}:`, error);
    }

    await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
    return { success: false, url: null };
  }
}
