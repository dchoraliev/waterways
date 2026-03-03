import React, { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import JourneyScreen from '../screens/JourneyScreen';
import { createTrip } from '../database/TripManager';
import { getDatabase } from '../database/db';
import { getSession } from '@waterways/shared/src/supabase/auth';
import { getCurrentCoordinates, startLocationTracking } from '../services/LocationService';
import { OFFLINE_USER_ID } from '../services/OfflineService';

const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';

export default function JourneyRoute() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use useFocusEffect to check for active trip every time screen is focused
  // This ensures we always create a new trip when starting a journey
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setCreating(true);

        try {
          // Start location tracking immediately when starting a journey
          await startLocationTracking();

          // Check if there's an active trip in storage
          const existingTripId = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);

          if (existingTripId) {
            // VALIDATE: Check if trip exists in DB and is still active (no end_time)
            const db = await getDatabase();
            if (db) {
              const trips = await db.getAllAsync<{ id: string; end_time: number | null }>(
                'SELECT id, end_time FROM trips WHERE id = ?',
                [existingTripId]
              );

              if (trips && trips.length > 0 && !trips[0].end_time) {
                // Trip exists and is still active - use it
                console.log('[JourneyRoute] Resuming existing active trip:', existingTripId);
                if (mounted) {
                  setTripId(existingTripId);
                  setCreating(false);
                }
                return;
              } else {
                // Trip completed or doesn't exist - clear stale ID
                console.log('[JourneyRoute] Clearing stale trip ID:', existingTripId);
                await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
              }
            }
          }

          // No existing active trip, create a new one
          console.log('[JourneyRoute] Creating new trip...');

          let userId = OFFLINE_USER_ID; // Default to offline user ID
          try {
            const { data } = await getSession();
            const user = data?.session?.user;
            if (user?.id) userId = user.id;
          } catch (e) {
            console.warn('Could not read session for trip creation:', e);
          }

          const coordinates = await getCurrentCoordinates();
          const id = await createTrip({
            user_id: userId,
            start_latitude: coordinates.latitude,
            start_longitude: coordinates.longitude,
          });

          // Store the new trip ID
          await AsyncStorage.setItem(ACTIVE_TRIP_KEY, id);

          if (mounted) {
            setTripId(id);
            console.log('[JourneyRoute] Created new trip:', id, coordinates);
          }
        } catch (err) {
          console.error('Failed to initialize trip:', err);
          if (mounted) setError(`Failed to initialize trip: ${err}`);
        } finally {
          if (mounted) setCreating(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  if (creating || !tripId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing trip...</Text>
      </View>
    );
  }

  return <JourneyScreen tripId={tripId} />;
}

// Export function to clear active trip (call this when ending journey)
export async function clearActiveTrip() {
  await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
  console.log('[JourneyRoute] Cleared active trip');
}
