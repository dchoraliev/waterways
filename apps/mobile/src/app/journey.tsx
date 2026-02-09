import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JourneyScreen from '../screens/JourneyScreen';
import { createTrip } from '../database/TripManager';
import { getSession } from '@waterways/shared/src/supabase/auth';
import { getCurrentCoordinates } from '../services/LocationService';

const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';

export default function JourneyRoute() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setCreating(true);

      try {
        // Check if there's an active trip in storage
        const existingTripId = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);

        if (existingTripId) {
          console.log('[JourneyRoute] Using existing trip:', existingTripId);
          if (mounted) {
            setTripId(existingTripId);
            setCreating(false);
          }
          return;
        }

        // No existing trip, create a new one
        console.log('[JourneyRoute] No existing trip, creating new one...');

        let userId = 'local-user';
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
  }, []);

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
