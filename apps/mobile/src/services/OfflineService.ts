import { getSession } from '@waterways/shared/src/supabase/auth';
import { getTripsByUserId, updateTripById } from '../database/TripManager';
import { getObservationsByUserId, updateObservationById } from '../database/ObservationManager';
import { performAutoSyncTaskOnce } from './NetworkService';
import { Observation, Trip } from '@waterways/shared/src/models/local-db-rows';

export const OFFLINE_USER_ID = 'offline-user';

export async function updateAndSyncOfflineDataToCurrentUser(): Promise<void> {
  // Check if we have a valid session before updating the offline data
  try {
    const { data, error } = await getSession();

    // If there's an error fetching the session, we can't proceed with updating the offline data
    if (error) {
      console.error('[OfflineService] Error fetching session:', error);
      return;
    }

    // We have a valid session, we can proceed with updating the offline data
    const currentUserId = data.session?.user?.id;
    console.log('[OfflineService] Converting offline data to current user ID:', currentUserId);

    // If we have pending offline data, we should trigger a sync here before navigating to the home screen
    const trips: Trip[] = await getTripsByUserId(OFFLINE_USER_ID);
    if (trips.length > 0) {
      // Move offline trips to the current user's account
      for (const trip of trips) {
        await updateTripById(trip.id, { user_id: currentUserId! });
      }
    }
    console.log(
      `[OfflineService] Successfully updated ${trips.length} offline trips to current user.`
    );

    const observations: Observation[] = await getObservationsByUserId(OFFLINE_USER_ID);
    if (observations.length > 0) {
      // Move offline observations to the current user's account
      for (const obs of observations) {
        await updateObservationById(obs.id, { user_id: currentUserId! });
      }
    }
    console.log(
      `[OfflineService] Successfully updated ${observations.length} offline observations to current user.`
    );

    // After updating the offline data to the current user, triger a one time sync for pending data
    performAutoSyncTaskOnce();
  } catch (_error) {
    // FIX: Renamed 'error' to '_error'
    console.error(
      '[OfflineService] An unexpected error occurred while fetching the session:',
      _error
    );
  }
}
