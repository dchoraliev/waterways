import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import JourneyScreen from '../screens/JourneyScreen';
import { createTrip } from '../database/TripManager';
import { getSession } from '@waterways/shared/src/supabase/auth';
import { getCurrentCoordinates } from '../services/LocationService';

interface SupabaseUser {
  id?: string;
}

// interface SupabaseSessionData {
//   session: {
//     user?: SupabaseUser;
//   } | null;
// }

export default function JourneyRoute() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCreating(true);
      let userId = 'local-user';
      try {
        const { data } = await getSession();
        const user = data?.session?.user;
        if (user?.id) userId = user.id;
      } catch (e) {
        console.warn('Could not read session for trip creation:', e);
      }

      try {
        const coordinates = await getCurrentCoordinates();
        const id = await createTrip({ user_id: userId, start_latitude: coordinates.latitude, start_longitude: coordinates.longitude });
        if (mounted) {
          setTripId(id);
          console.log('Created trip:', id, coordinates);
        }
      } catch (err) {
        console.error('Failed to create trip on mount:', err);
        if (mounted) setError(`Failed to create trip: ${err}`);
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
