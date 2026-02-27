import { getSession } from '@waterways/shared/src/supabase/auth';
import { Alert } from 'react-native';
import { getTripsByUserId, updateTripById } from '../database/TripManager';
import { getObservationsByUserId, updateObservationById } from '../database/ObservationManager';
import { performAutoSyncTaskOnce } from './NetworkService';
import { saveAudioObservationForTrip } from './VoiceRecorder';
import { get } from 'http';
import { Observation } from '@waterways/shared/src/models/local-db-rows';

export const OFFLINE_USER_ID = 'offline-user';

export async function updateAndSyncOfflineDataToCurrentUser(): Promise<void> {
  // Check if we have a valid session before updating the offline data
  try {
    const { data, error } = await getSession();

    // If there's an error fetching the session, we can't proceed with updating the offline data
    if (error) {
      console.error('Error fetching session:', error);
      return;
    }

    // We have a valid session, we can proceed with updating the offline data
    console.log('Login successful! User ID:', data.session?.user?.id);
    const currentUserId = data.session?.user?.id;
    // TODO: If we have pending offline data, we should trigger a sync here before navigating to the home screen
    const trips = await getTripsByUserId(OFFLINE_USER_ID);
    ///////////////// Temp Block start
    const additionalTrips = await getTripsByUserId('local-user');
    trips.push(...additionalTrips);
    ///////////////// Temp block end
    if (trips.length > 0) {
      // Move offline trips to the current user's account
      for (const trip of trips) {
        await updateTripById(trip.id, { user_id: currentUserId! });
      }
    }
    console.log('Offline trips updated to current user account');

    const observations: Observation[] = await getObservationsByUserId(OFFLINE_USER_ID);
    ///////////////// Temp Block start
    const additionalObservations: Observation[] = await getObservationsByUserId('local-user');
    observations.push(...additionalObservations);
    ///////////////// Temp block end
    if (observations.length > 0) {
      // Move offline observations to the current user's account
      for (const obs of observations) {
        await updateObservationById(obs.id, { user_id: currentUserId! });
      }
    }
    console.log('Offline observations updated to current user account');

    // After updating the offline data to the current user, triger a one time sync for pending data
    performAutoSyncTaskOnce();
  } catch (_error) {
    // FIX: Renamed 'error' to '_error'
    console.error('An unexpected error occurred while fetching the session:', _error);
  }
}
