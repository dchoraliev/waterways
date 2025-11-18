import React from 'react';
import { useRouter } from 'expo-router';
import JourneyScreen from '../screens/JourneyScreen';

export default function JourneyRoute() {
  const router = useRouter();

  const handleEndJourney = () => {
    const sampleTripId = 'sample-trip';
    router.replace(`/review/${sampleTripId}`);
  };

  return <JourneyScreen onEndJourney={handleEndJourney} />;
}
