import React, { useCallback, useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { DraftJourneysProvider } from '../hooks/useDraftJourneys';
import * as Notifications from 'expo-notifications';
import TripRecoveryModal from '../components/TripRecoveryModal';
import {
  checkForIncompleteTrip,
  discardIncompleteTrip,
  resumeTrip,
  type IncompleteTrip,
} from '../services/TripRecoveryService';

function ThemedAppShell() {
  const router = useRouter();
  const { mode, colors, isReady } = useTheme();
  const [incompleteTrip, setIncompleteTrip] = useState<IncompleteTrip | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkIncompleteTrips = async () => {
      try {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 1000));
        const trip = await checkForIncompleteTrip();

        if (trip && mounted) {
          setIncompleteTrip(trip);
          setShowRecoveryModal(true);
        }
      } catch (error) {
        console.error('[App] Error checking for incomplete trips:', error);
      }
    };

    void checkIncompleteTrips();

    return () => {
      mounted = false;
    };
  }, []);

  const handleResumeTrip = useCallback(async () => {
    if (!incompleteTrip) return;

    try {
      await resumeTrip(incompleteTrip.id, incompleteTrip.isReviewing);
      setShowRecoveryModal(false);
      setIncompleteTrip(null);
      router.push('/journey');
    } catch (error) {
      console.error('[App] Error resuming trip:', error);
    }
  }, [incompleteTrip, router]);

  const handleDiscardTrip = useCallback(async () => {
    if (!incompleteTrip) return;

    try {
      await discardIncompleteTrip(incompleteTrip.id);
      setShowRecoveryModal(false);
      setIncompleteTrip(null);
    } catch (error) {
      console.error('[App] Error discarding trip:', error);
    }
  }, [incompleteTrip]);

  useEffect(() => {
    if (!isReady) return;

    let mounted = true;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        route?: string;
        tripId?: string;
      };

      if (!mounted || !data?.route) return;

      router.push(data.route as Parameters<typeof router.push>[0]);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    Notifications.getLastNotificationResponseAsync()
      .then((response: Notifications.NotificationResponse | null) => {
        if (response) handleResponse(response);
      })
      .catch((error: unknown) => {
        console.warn('[Notifications] Failed to read last response:', error);
      });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [isReady, router]);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <DraftJourneysProvider>
        <TripRecoveryModal
          visible={showRecoveryModal}
          trip={incompleteTrip}
          onResume={handleResumeTrip}
          onDiscard={handleDiscardTrip}
        />
        <Slot />
      </DraftJourneysProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedAppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
