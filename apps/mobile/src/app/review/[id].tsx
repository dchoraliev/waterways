import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ReviewScreen from '../../screens/ReviewScreen';

export default function ReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ReviewScreen tripId={id ?? 'unknown'} />;
}
