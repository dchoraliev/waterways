/**
 * Handles detection of incomplete trips (force stops, crashes, etc.)
 * Trips persist until user explicitly resumes or discards them.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database/db';
import { getObservationsByTripId } from '../database/ObservationManager';

const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';
const LAST_SAVE_KEY = '@waterways:last_auto_save';
const APP_STATE_KEY = '@waterways:app_state';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export interface IncompleteTrip {
  id: string;
  start_time: number;
  observationCount: number;
  mediaCount: number;
  lastSaved: number;
  isReviewing: boolean;
}

/**
 * Check if there's an incomplete trip (active journey with no end_time)
 * This runs on app launch to detect force stops
 * Trip stays in recovery state until user takes action
 *
 * IMPORTANT: Returns null if trip has 0 observations (empty journey)
 */
export async function checkForIncompleteTrip(): Promise<IncompleteTrip | null> {
  try {
    console.log('[TripRecovery] Checking for incomplete trips...');

    const activeTripId = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);

    if (!activeTripId) {
      console.log('[TripRecovery] No active trip ID in storage');
      return null;
    }

    const db = await getDatabase();
    if (!db) {
      console.error('[TripRecovery] Database not initialized');
      return null;
    }

    // Check if trip exists and is incomplete
    const trips = await db.getAllAsync<{
      id: string;
      start_time: number;
      end_time: number | null;
      sync_status: string | null;
    }>('SELECT id, start_time, end_time, sync_status FROM trips WHERE id = ?', [activeTripId]);

    if (!trips || trips.length === 0) {
      console.log('[TripRecovery] Trip not found in database:', activeTripId);
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      await AsyncStorage.removeItem(LAST_SAVE_KEY);
      await AsyncStorage.removeItem(APP_STATE_KEY);
      return null;
    }

    const trip = trips[0];

    // If trip has end_time, it was ended - not an incomplete journey
    if (trip.end_time) {
      console.log('[TripRecovery] Trip is complete (has end_time), clearing storage');
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      await AsyncStorage.removeItem(LAST_SAVE_KEY);
      await AsyncStorage.removeItem(APP_STATE_KEY);
      return null;
    }

    // If trip is already synced, it's complete
    if (trip.sync_status === 'synced') {
      console.log('[TripRecovery] Trip already synced, clearing storage');
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      await AsyncStorage.removeItem(LAST_SAVE_KEY);
      await AsyncStorage.removeItem(APP_STATE_KEY);
      return null;
    }

    // Trip is incomplete - has no end_time
    const lastAppState = await AsyncStorage.getItem(APP_STATE_KEY);
    const lastSave = await AsyncStorage.getItem(LAST_SAVE_KEY);

    console.log('[TripRecovery] ⚠️ INCOMPLETE JOURNEY DETECTED:');
    console.log('[TripRecovery]   Trip ID:', trip.id);
    console.log('[TripRecovery]   Started:', new Date(trip.start_time).toLocaleString());
    console.log('[TripRecovery]   Last app state:', lastAppState);
    console.log(
      '[TripRecovery]   Last auto-save:',
      lastSave ? new Date(Number.parseInt(lastSave)).toLocaleString() : 'never'
    );

    // Get observation count
    const observations = await getObservationsByTripId(trip.id);
    const observationCount = observations?.length || 0;

    // CRITICAL CHECK: Don't recover empty journeys (0 observations)
    if (observationCount === 0) {
      console.log('[TripRecovery] ❌ Trip has 0 observations - discarding empty journey');

      // Delete the empty trip
      await db.runAsync('DELETE FROM trips WHERE id = ?', [trip.id]);

      // Clear storage
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      await AsyncStorage.removeItem(LAST_SAVE_KEY);
      await AsyncStorage.removeItem(APP_STATE_KEY);

      console.log('[TripRecovery] Empty journey cleaned up');
      return null;
    }

    // Get media count - ONLY COUNT PHOTOS/VIDEOS (not audio)
    const mediaResult = await db.getAllAsync<{
      count: number;
      media_type: string | null;
    }>(
      `SELECT COUNT(*) as count, media_type
       FROM observation_media 
       WHERE observation_id IN (
         SELECT id FROM observations WHERE trip_id = ?
       )
       AND media_type IN ('image', 'video')
       GROUP BY media_type`,
      [trip.id]
    );

    // Calculate total media count (photos + videos only)
    let totalMediaCount = 0;
    const mediaBreakdown: { [key: string]: number } = {};

    if (mediaResult && mediaResult.length > 0) {
      mediaResult.forEach((row) => {
        const type = row.media_type || 'unknown';
        mediaBreakdown[type] = row.count;
        totalMediaCount += row.count;
      });
    }

    // Also check observations table for local_media_id references (photos/videos only)
    const obsWithMediaResult = await db.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM observations 
       WHERE trip_id = ? AND local_media_id IS NOT NULL`,
      [trip.id]
    );
    const obsWithMediaCount = obsWithMediaResult[0]?.count || 0;

    // Also check for audio media separately (for logging, not counting in final)
    const audioResult = await db.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM observation_media 
       WHERE observation_id IN (
         SELECT id FROM observations WHERE trip_id = ?
       )
       AND media_type = 'audio'`,
      [trip.id]
    );
    const audioCount = audioResult[0]?.count || 0;

    console.log('[TripRecovery]   Observations:', observationCount);
    console.log('[TripRecovery]   Photos/Videos (observation_media):', totalMediaCount);
    console.log('[TripRecovery]   Photo/Video breakdown:', mediaBreakdown);
    console.log('[TripRecovery]   Observations with local_media_id:', obsWithMediaCount);
    console.log('[TripRecovery]   Audio recordings (not counted):', audioCount);

    // Use the higher count (in case there's a sync issue)
    const finalMediaCount = Math.max(totalMediaCount, obsWithMediaCount);

    if (finalMediaCount !== totalMediaCount) {
      console.warn(
        '[TripRecovery]   ⚠️ Media count mismatch! Using higher count:',
        finalMediaCount
      );
    }

    // Detect force stop
    if (lastAppState === 'journey' || lastAppState === 'background') {
      console.log('[TripRecovery] 🔴 FORCE STOP DETECTED - App did not close gracefully');
    }

    return {
      id: trip.id,
      start_time: trip.start_time,
      observationCount,
      mediaCount: finalMediaCount, // Only photos/videos, not audio
      lastSaved: lastSave ? Number.parseInt(lastSave) : trip.start_time,
      isReviewing: false,
    };
  } catch (error) {
    console.error('[TripRecovery] Error checking for incomplete trip:', error);
    return null;
  }
}

/**
 * Discard an incomplete trip
 * Deletes trip, observations, media, and clears all storage
 */
export async function discardIncompleteTrip(tripId: string): Promise<void> {
  try {
    console.log('[TripRecovery] Discarding incomplete trip:', tripId);

    const db = await getDatabase();
    if (!db) return;

    // Log what we're about to delete (photos/videos only)
    const mediaCount = await db.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM observation_media 
       WHERE observation_id IN (
         SELECT id FROM observations WHERE trip_id = ?
       )
       AND media_type IN ('image', 'video')`,
      [tripId]
    );

    const obsCount = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM observations WHERE trip_id = ?',
      [tripId]
    );

    console.log('[TripRecovery] Deleting:', {
      observations: obsCount[0]?.count || 0,
      photosVideos: mediaCount[0]?.count || 0,
    });

    // Delete ALL observation media (including audio)
    await db.runAsync(
      `DELETE FROM observation_media 
       WHERE observation_id IN (
         SELECT id FROM observations WHERE trip_id = ?
       )`,
      [tripId]
    );

    // Delete observations
    await db.runAsync('DELETE FROM observations WHERE trip_id = ?', [tripId]);

    // Delete trip
    await db.runAsync('DELETE FROM trips WHERE id = ?', [tripId]);

    // Clear AsyncStorage
    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    await AsyncStorage.removeItem(LAST_SAVE_KEY);
    await AsyncStorage.removeItem(APP_STATE_KEY);

    console.log('[TripRecovery] Trip discarded successfully');
  } catch (error) {
    console.error('[TripRecovery] Error discarding trip:', error);
    throw error;
  }
}

/**
 * Resume trip - keeps AsyncStorage intact
 */
export async function resumeTrip(tripId: string, _isReviewing: boolean = false): Promise<void> {
  // Changed: isReviewing -> _isReviewing (unused parameter)
  try {
    console.log('[TripRecovery] Resuming trip:', tripId);

    await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);
    await AsyncStorage.setItem(APP_STATE_KEY, 'journey');

    console.log('[TripRecovery] Trip resumed - journey will continue');
  } catch (error) {
    console.error('[TripRecovery] Error resuming trip:', error);
    throw error;
  }
}

/**
 * Auto-save trip state (called every 30 seconds during journey)
 */
export async function autoSaveTripState(_tripId: string): Promise<void> {
  // Changed: tripId -> _tripId (unused in function body)
  try {
    const now = Date.now();

    await AsyncStorage.setItem(LAST_SAVE_KEY, now.toString());
    await AsyncStorage.setItem(APP_STATE_KEY, 'journey');

    console.log('[TripRecovery] Auto-saved trip state at', new Date(now).toLocaleTimeString());
  } catch (error) {
    console.error('[TripRecovery] Auto-save failed:', error);
  }
}

/**
 * Start auto-save interval (call this when journey starts)
 */
export function startAutoSave(tripId: string): ReturnType<typeof globalThis.setInterval> {
  console.log('[TripRecovery] Starting auto-save (every 30 seconds)');

  // Save immediately
  void autoSaveTripState(tripId);

  // Then save every 30 seconds
  const interval = globalThis.setInterval(() => {
    void autoSaveTripState(tripId);
  }, AUTO_SAVE_INTERVAL);

  return interval;
}

/**
 * Stop auto-save interval (call this when journey ends)
 */
export function stopAutoSave(interval: ReturnType<typeof globalThis.setInterval>): void {
  console.log('[TripRecovery] Stopping auto-save');
  globalThis.clearInterval(interval);
}

/**
 * Mark journey as ending gracefully (call when ending journey)
 */
export async function markJourneyEnding(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
  await AsyncStorage.removeItem(LAST_SAVE_KEY);
  await AsyncStorage.setItem(APP_STATE_KEY, 'ended');
  console.log('[TripRecovery] Journey marked as ended gracefully');
}

/**
 * Mark app as closing gracefully
 */
export async function markAppClosingGracefully(): Promise<void> {
  await AsyncStorage.setItem(APP_STATE_KEY, 'closed');
  console.log('[TripRecovery] App state marked as closed gracefully');
}
