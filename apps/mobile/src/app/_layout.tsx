import React, { useState, useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DraftJourneysProvider } from '../hooks/useDraftJourneys';
import TripRecoveryModal from '../components/TripRecoveryModal';
import {
  checkForIncompleteTrip,
  discardIncompleteTrip,
  resumeTrip,
  type IncompleteTrip,
} from '../services/TripRecoveryService';

export default function RootLayout() {
  const router = useRouter();
  const [incompleteTrip, setIncompleteTrip] = useState<IncompleteTrip | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Check for incomplete trips on app launch
  useEffect(() => {
    async function checkIncompleteTrips() {
      try {
        console.log('[App] Checking for incomplete trips on launch...');

        // Wait a bit for database to initialize
        await new Promise((resolve) => globalThis.setTimeout(resolve, 1000));

        const trip = await checkForIncompleteTrip();

        if (trip) {
          console.log('[App] Found incomplete trip, showing recovery modal');
          setIncompleteTrip(trip);
          setShowRecoveryModal(true);
        } else {
          console.log('[App] No incomplete trips found');
        }
      } catch (error) {
        console.error('[App] Error checking for incomplete trips:', error);
      }
    }

    void checkIncompleteTrips();
  }, []);

  // Handle Resume - go directly to journey screen
  const handleResumeTrip = async () => {
    if (!incompleteTrip) return;

    try {
      console.log('[App] Resuming trip:', incompleteTrip.id);

      // Mark as resumed (keeps AsyncStorage keys)
      await resumeTrip(incompleteTrip.id, incompleteTrip.isReviewing);

      // Hide modal
      setShowRecoveryModal(false);
      setIncompleteTrip(null);

      // Navigate to journey screen (always, even if was reviewing)
      router.push('/journey');
    } catch (error) {
      console.error('[App] Error resuming trip:', error);
    }
  };

  // Handle Discard - delete everything
  const handleDiscardTrip = async () => {
    if (!incompleteTrip) return;

    try {
      console.log('[App] Discarding trip:', incompleteTrip.id);

      // Delete the trip and clear all storage
      await discardIncompleteTrip(incompleteTrip.id);

      // Hide modal
      setShowRecoveryModal(false);
      setIncompleteTrip(null);

      console.log('[App] Trip discarded successfully');
    } catch (error) {
      console.error('[App] Error discarding trip:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <DraftJourneysProvider>
        {/* Trip Recovery Modal - Only Resume or Discard */}
        <TripRecoveryModal
          visible={showRecoveryModal}
          trip={incompleteTrip}
          onResume={handleResumeTrip}
          onDiscard={handleDiscardTrip}
        />

        {/* App Content */}
        <Slot />
      </DraftJourneysProvider>
    </SafeAreaProvider>
  );
}
