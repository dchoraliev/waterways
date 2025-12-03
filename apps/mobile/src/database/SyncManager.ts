import { supabase } from "@shared/supabase/client";
import { getTripById, updateTripById } from "./TripManager";
import { getObservationById, getObservationsByTripId, updateObservationById } from "./ObservationManager";

import { getMediaById, updateMediaById } from "./MediaManager";

// ==================================================
// Sync Status Enum
// ==================================================
export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error',
}

/**
 * Sync a trip → observations → multimedia.
 */
export async function syncTrip(tripId: string): Promise<void> {
  console.log(`Syncing trip: ${tripId}`);

  // Update the status of the trip to SYNCING
  await updateTripById(tripId, { sync_status: SyncStatus.SYNCING });

  // Before syncing the trip, we need to make sure that all the observations (includes media) are synced
  const success = await syncObservations(tripId);

  // Finally, sync the trip record
  // TODO

  console.log(`✅ Trip synced: ${tripId}`);
}

/**
 * Sync all observations for a given trip.
 */
async function syncObservations(tripId: string): Promise<boolean> {
    // Get all observations for the trip
  const observations = await getObservationsByTripId(tripId);
  console.log(`Syncing ${observations.length} observations for trip ${tripId}`);

  // We need the media to be synced first
  let mediaFailure: boolean= false;
  for (const obs of observations) {
    // Observation has a local media file which needs to be uploaded
    if (obs.local_media_id) {
      // Upload if there is no failure yet
      if (!mediaFailure){
        console.log(`Syncing observation media: ${obs.id}`);
        // const { success, url } = await syncMedia(obs.local_media_id);
        // if (success && url) {
        //   // Update the observation with the new multimedia URL
        //   await updateObservationById(obs.id, { multimedia_url: url });
        // }
      }

      // If there was a failure, mark other trip media as failed
      else {
      // Change the status to failed
      }
    }
    
  }
  return true;
}

/**
 * Upload all multimedia for a single observation.
 */
// async function syncMedia(mediaId: string): Promise<{ success: boolean; url: string | null }> {
//   try {
//     const item = await getMediaById(mediaId);
//     if (!item) {
//       console.error(`Media not found: ${mediaId}`);
//       return { success: false };
//     }

//     // Already uploaded?
//     if (item.remoteUrl) {
//       console.log(`    ↪ Already uploaded: ${item.remoteUrl}`);
//       return { success: true, url: item.remoteUrl };
//     }

//     console.log(`    🔄 Uploading media: ${mediaId}`);

//     const bucket = 'observations';
//     const ext = item.extension || 'jpg';
//     const filePath = `${item.observation_id}/${item.id}_${Date.now()}.${ext}`;

//     const uploadRes = await supabase.storage
//       .from(bucket)
//       .upload(filePath, {
//         uri: item.localPath,
//         type: item.mimeType,
//         name: filePath,
//       });

//     if (uploadRes.error) {
//       console.error(uploadRes.error);
//       return { success: false };
//     }

//     const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;

//     // Save URL locally
//     await updateMediaById(mediaId, { remoteUrl: publicUrl });

//     console.log(`    ✅ Uploaded media → ${publicUrl}`);

//     return { success: true, url: publicUrl };
//   } catch (err) {
//     console.error(`syncSingleMedia(${mediaId}) failed:`, err);
//     return { success: false };
//   }
// }