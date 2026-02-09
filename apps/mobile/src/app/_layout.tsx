import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DraftJourneysProvider } from '../hooks/useDraftJourneys';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DraftJourneysProvider>
        <Slot />
      </DraftJourneysProvider>
    </SafeAreaProvider>
  );
}
