import React from 'react';
import { Slot } from 'expo-router';
import { DraftJourneysProvider } from '../hooks/useDraftJourneys';

export default function RootLayout() {
  return (
    <DraftJourneysProvider>
      <Slot />
    </DraftJourneysProvider>
  );
}
