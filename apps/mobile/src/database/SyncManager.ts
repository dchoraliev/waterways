import { supabase } from '@shared/supabase/client';
import { getTripById, getTripsBySyncStatus, updateTripById } from './TripManager';
import { getObservationsByTripId, updateObservationById } from './ObservationManager';

import { getMediaById, updateMediaById } from './MediaManager';
import { SyncStatus } from './SyncStatus';

const IMAGE_BUCKET = 'Images';
const VIDEO_BUCKET = 'Vidoes';
let observationMediaUpsertAvailable = true;

function getMediaBucketName(mediaType: string | null | undefined): string {
  return mediaType === 'video' ? VIDEO_BUCKET : IMAGE_BUCKET;
}

function getMediaFileExtension(mediaType: string | null | undefined): string {
  if (mediaType === 'video') return 'mp4';
  return 'jpg';
}

function getMediaContentType(mediaType: string | null | undefined): string {
  if (mediaType === 'video') return 'video/mp4';
  return 'image/jpeg';
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
  const pendingTrips = await getTripsBySyncStatus(SyncStatus.PENDING);
  console.log(`Found ${pendingTrips.length} trips pending sync. Starting sync process...`);
  for (const trip of pendingTrips) {
    try {
      await syncTrip(trip.id);
    } catch (error) {
      console.error(`Error syncing trip ${trip.id}:`, error);
    }
  }
}

export async function syncAllFailedTrips(): Promise<void> {
  // Get all trips with error sync status
  const failedTrips = await getTripsBySyncStatus(SyncStatus.ERROR);
  console.log(`Found ${failedTrips.length} trips with failed sync. Starting retry process...`);
  for (const trip of failedTrips) {
    try {
      await syncTrip(trip.id);
    } catch (error) {
      console.error(`Error retrying sync for trip ${trip.id}:`, error);
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
    console.log('Syncing trip - ', payload);
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
        console.log(`Trip synced - ${tripId}`);
        await updateTripById(tripId, {
          sync_status: SyncStatus.SYNCED,
          last_synced_at: Date.now(),
        });
      } else {
        // Block the trip sync due to observation sync failure
        console.error(`Sync blocked for trip ${tripId} due to failed observations upload`);
        await updateTripById(tripId, { sync_status: SyncStatus.ERROR });
      }
    } else {
      // Error occured during trip sync
      console.error(`Sync failed for Trip ${tripId}. ERROR: `, error);
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
  console.log(`Syncing ${observations.length} observations for trip ${tripId}`);
  let failure_encountered = false;

  // Check if the received supabase_id is a valid uuid to trust it (must be 36 length)
  if (!supabaseTripId || supabaseTripId.length !== 36) {
    // Mark each obs failed sync, because the supabase trip id is invalid
    console.error(
      `Sync observations for trip ID ${tripId} failed: Invaild supabase trip id was provided.`
    );
    for (const obs of observations) {
      await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
    }
    return false;
  }

  // Update the trip id and sync the observation as well as the media.
  console.warn(
    `Updating the observations trip ID from ${tripId} to supabase trip ID ${supabaseTripId}`
  );
  for (const obs of observations) {
    await updateObservationById(obs.id, { supabase_trip_id: supabaseTripId });

    let upload_failed = false;
    let observationMediaUrls: string[] | null = null;
    // Observation has a local media file which needs to be uploaded first
    if (obs.local_media_id) {
      const { success, url } = await syncMedia(obs.local_media_id);
      if (success && url) {
        // Update the observation with the new multimedia URL
        await updateObservationById(obs.id, { multimedia_url: url });
        observationMediaUrls = [url];
      } else {
        // Mark the media upload as failed so the observation is not synced
        upload_failed = true;
      }
    }

    // Now sync the observation based on the media upload status
    if (!upload_failed) {
      // Upload the observation
      const payload = {
        unique_userID_localID_pair: obs.user_id + '-' + obs.id,
        user_id: obs.user_id,
        trip_id: supabaseTripId,
        created_at: parseDateTime(obs.created_at),
        location: parseLocationAsEWKT(obs.longitude, obs.latitude),
        observation: obs.observation ?? undefined,
        observation_media: observationMediaUrls,
        // category_ids: null                     TODO: need to insert the observation as array of index
      };
      console.log(`Sycing observation - `, payload);
      const { error } = await supabase
        .from('observations')
        .upsert(payload, { onConflict: 'unique_userID_localID_pair' });

      if (error) {
        // Error encountered
        failure_encountered = true;
        console.error(`Sync failed for observation id ${obs.id}. ERROR: `, error);
        await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
      } else {
        // Update the sync status on success
        console.log(`Observation synced - ${obs.id}`);
        await updateObservationById(obs.id, {
          sync_status: SyncStatus.SYNCED,
          last_synced_at: Date.now(),
        });
      }
    } else {
      // Mark the current observation as failed due to media upload failure
      failure_encountered = true;
      console.error(`Sync blocked for observations ${obs.id} due to failed media upload`);
      await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
    }
  }

  // Return if all the observations are succesfully uploaded or if any failures were seen.
  return !failure_encountered;
}

/**
 * Upload all multimedia for a single observation.
 */
async function syncMedia(mediaId: string): Promise<{ success: boolean; url: string | null }> {
  const media = await getMediaById(mediaId);
  if (!media) {
    console.error(`Sync failed: media ${mediaId} was not found in local database`);
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
      console.error(`Sync failed: upload error for media ${mediaId}`, uploadError);
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
    console.error(`Sync failed: unexpected error while uploading media ${mediaId}`, error);
    await updateMediaById(mediaId, { sync_status: SyncStatus.ERROR });
    return { success: false, url: null };
  }
}
