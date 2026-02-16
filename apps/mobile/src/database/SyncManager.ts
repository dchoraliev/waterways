import { supabase } from '@shared/supabase/client';
import { getTripById, getTripsBySyncStatus, updateTripById } from './TripManager';
import { getObservationsByTripId, updateObservationById } from './ObservationManager';

import { getMediaById, updateMediaById } from './MediaManager';

// ==================================================
// Sync Status Enum
// ==================================================
export enum SyncStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SYNCED = 'synced',
  ERROR = 'error',
}

/**
 * @param tripId
 */
async function logSyncStatus(
  table_name: string,
  record_id: string,
  status: SyncStatus,
  error_message?: string
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
    // Observation has a local media file which needs to be uploaded first
    if (obs.local_media_id) {
      const { success, url } = await syncMedia(obs.local_media_id);
      if (success && url) {
        // Update the observation with the new multimedia URL
        await updateObservationById(obs.id, { multimedia_url: url });
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
        trip_id: obs.supabase_trip_id,
        created_at: parseDateTime(obs.created_at),
        location: parseLocationAsEWKT(obs.longitude, obs.latitude),
        observation: obs.observation ?? undefined,
        // category_ids: null                     TODO: need to insert the observation as array of index
        // observation_media:                     TODO: need to insert the media urls as array
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
  // TODO: Implement media upload as per the files types and supabase storage configuration
  // TODO: Update the sync log and status accordingly
  return { success: true, url: null };
}
