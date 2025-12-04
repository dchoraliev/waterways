import { supabase } from '@shared/supabase/client';
import { getTripById, updateTripById } from './TripManager';
import { getObservationsByTripId, updateObservationById } from './ObservationManager';

import { getMediaById, updateMediaById } from './MediaManager';

// ==================================================
// Sync Status Enum
// ==================================================
export enum SyncStatus {
  PENDING = 'pending',
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
 * Sync a trip → observations → multimedia.
 */
export async function syncTrip(tripId: string): Promise<void> {
  console.log(`Syncing trip - ${tripId}`);

  // Before syncing the trip, we need to make sure that all the observations (includes media) are synced
  const success = await syncObservations(tripId);

  // Finally, sync the trip record if all the observations were synced succesfully
  if (success) {
    const tripRecord = await getTripById(tripId);
    if (tripRecord) {
      const { error } = await supabase.from('trips').upsert(
        {
          id: tripRecord.id,
          user_id: tripRecord.user_id,
          project_id: tripRecord.project_id,
          created_at: tripRecord.created_at.toString(),
          start_time: tripRecord.start_time?.toString(),
          end_time: tripRecord.end_time?.toString(),
          start_location: {
            type: 'Point',
            coordinates: [tripRecord.start_longitude?.toString(), tripRecord.start_latitude?.toString()],
          },
          end_location: {
            type: 'Point',
            coordinates: [tripRecord.end_longitude?.toString(), tripRecord.end_latitude?.toString()],
          },
        },
        { onConflict: 'id,user_id' }
      );
      if (error) {
        console.warn(`Sync failed for observations ${tripRecord.id}. ERROR: ${error}`);
        await updateTripById(tripId, { sync_status: SyncStatus.ERROR });
      } else {
        // Sync successful
        console.log(`Trip synced - ${tripId}`);
        await updateTripById(tripId, {
          sync_status: SyncStatus.SYNCED,
          last_synced_at: Date.now(),
        });
      }
    }
  } else {
    // Block the trip sync due to observation sync failure
    console.warn(`Sync blocked for trip ${tripId} due to failed observations upload`);
    await updateTripById(tripId, { sync_status: SyncStatus.ERROR });
  }
}

/**
 * Sync all observations for a given trip.
 */
async function syncObservations(tripId: string): Promise<boolean> {
  // Get all observations for the trip
  const observations = await getObservationsByTripId(tripId);
  console.log(`Syncing ${observations.length} observations for trip ${tripId}`);
  let failure_encountered = false;

  // We need the media to be synced first
  for (const obs of observations) {
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
      const { error } = await supabase.from('observations').upsert(
        {
          local_observation_id: obs.id,
          user_id: obs.user_id,
          trip_id: obs.trip_id,
          created_at: obs.created_at.toString(),
          location: { type: 'Point', coordinates: [obs.longitude?.toString(), obs.latitude,toString()] },
          observation: obs.observation,
          // category_ids: null                     TODO: need to insert the observation as array of index
          // observation_media:                     TODO: need to insert the media urls as array
        },
        { onConflict: 'local_observation_id,user_id,trip_id' }
      );

      if (error) {
        // Error encountered
        failure_encountered = true;
        console.warn(`Sync failed for observation id ${obs.id}. ERROR: ${error}`);
        await updateObservationById(obs.id, { sync_status: SyncStatus.ERROR });
      } else {
        // Update the sync status on success
        await updateObservationById(obs.id, {
          sync_status: SyncStatus.SYNCED,
          last_synced_at: Date.now(),
        });
      }
    } else {
      // Mark the current observation as failed due to media upload failure
      failure_encountered = true;
      console.warn(`Sync blocked for observations ${obs.id} due to failed media upload`);
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
  return { success: false, url: null };
}
