import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import ListeningBanner from '../components/ListeningBanner';
import { RecentObservationItem } from '../components/RecentObservationItem';
import { styles } from '../styles/JourneyScreen.styles';

import { updateTripById } from '../database/TripManager';
import { getObservationsByTripId } from '../database/ObservationManager';

import { getCurrentUserId } from '../services/AuthService';
import { getCurrentCoordinates, stopLocationTracking } from '../services/LocationService';
import { transcribeTripAudio } from '../services/TranscriptionService';
import { showToast } from '../utils/toast';

// expo-audio (NOT expo-av)
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { saveAudioObservationForTrip } from '../services/VoiceRecorder';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMediaCountsForTrip } from '../services/MediaQueries';

const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';

type ObservationRow = {
  id: string;
  created_at?: number | null;
};

interface DBObservationRow {
  id: string;
  created_at?: number | null;
}

function formatDuration(secondsTotal: number) {
  const s = Math.max(0, Math.floor(secondsTotal));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

interface JourneyScreenProps {
  tripId: string;
}

export default function JourneyScreen({ tripId }: JourneyScreenProps) {
  const router = useRouter();
  const journeyStartRef = useRef<number>(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const [loadingObservations, setLoadingObservations] = useState(true);
  const [observations, setObservations] = useState<ObservationRow[]>([]);

  // Media counts (loaded from database)
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);

  // --- Audio recording state (manual observation) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  const isRecording = !!recState?.isRecording;
  const [savingManualObservation, setSavingManualObservation] = useState(false);

  // --- End journey state ---
  const [endingJourney, setEndingJourney] = useState(false);

  // --- Camera window state (10 seconds after observation) ---
  const [cameraWindowActive, setCameraWindowActive] = useState(false);
  const [cameraWindowSecondsLeft, setCameraWindowSecondsLeft] = useState(0);
  const [lastObservationId, setLastObservationId] = useState<string | null>(null);
  // eslint-disable-next-line no-undef
  const cameraWindowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const t = setInterval(() => {
      const s = (Date.now() - journeyStartRef.current) / 1000;
      setSecondsElapsed(s);
    }, 1000);
    // eslint-disable-next-line no-undef
    return () => clearInterval(t);
  }, []);

  const loadObservations = useCallback(async (activeTripId: string) => {
    setLoadingObservations(true);
    try {
      const rows = await getObservationsByTripId(activeTripId);
      const normalized: ObservationRow[] = (rows ?? []).map((r: DBObservationRow) => ({
        id: r.id,
        created_at: r.created_at ?? null,
      }));

      normalized.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
      setObservations(normalized);

      // Load media counts
      const counts = await getMediaCountsForTrip(activeTripId);
      setPhotoCount(counts.photoCount);
      setVideoCount(counts.videoCount);
    } catch (e) {
      console.warn('Failed to load observations:', e);
    } finally {
      setLoadingObservations(false);
    }
  }, []);

  useEffect(() => {
    if (!tripId) return;
    void loadObservations(tripId);
  }, [tripId, loadObservations]);

  // Start 10-second camera window
  const startCameraWindow = useCallback((observationId: string) => {
    console.log('[DEBUG] startCameraWindow called with ID:', observationId);

    // Clear any existing timer
    if (cameraWindowTimerRef.current) {
      console.log('[DEBUG] Clearing existing camera timer');
      // eslint-disable-next-line no-undef
      clearInterval(cameraWindowTimerRef.current);
    }

    setLastObservationId(observationId);
    setCameraWindowActive(true);
    setCameraWindowSecondsLeft(10);

    console.log('[DEBUG] Camera window activated, countdown started');

    // Countdown timer
    // eslint-disable-next-line no-undef
    cameraWindowTimerRef.current = setInterval(() => {
      setCameraWindowSecondsLeft((prev) => {
        console.log('[DEBUG] Camera window seconds left:', prev - 1);
        if (prev <= 1) {
          // Window expired
          console.log('[DEBUG] Camera window expired');
          if (cameraWindowTimerRef.current) {
            // eslint-disable-next-line no-undef
            clearInterval(cameraWindowTimerRef.current);
            cameraWindowTimerRef.current = null;
          }
          setCameraWindowActive(false);
          setLastObservationId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup camera window timer on unmount
  useEffect(() => {
    return () => {
      if (cameraWindowTimerRef.current) {
        // eslint-disable-next-line no-undef
        clearInterval(cameraWindowTimerRef.current);
      }
    };
  }, []);

  // Manual observation button
  const onManualObservationPress = useCallback(async () => {
    if (!tripId) return;

    if (savingManualObservation) return;

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        showToast('Not logged in. Please sign in again.');
        return;
      }

      if (!isRecording) {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          showToast('Microphone permission denied.');
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await recorder.prepareToRecordAsync();
        recorder.record();

        // Removed toast - UI shows recording state
        return;
      }

      // Stop and save
      setSavingManualObservation(true);

      await recorder.stop();

      const fileUri = recorder.uri;
      if (!fileUri) {
        showToast('Recording failed (no file). Try again.');
        return;
      }

      console.log('[DEBUG] About to save observation with URI:', fileUri);

      const observationId = await saveAudioObservationForTrip(tripId, userId, fileUri);

      console.log('[DEBUG] Observation ID returned:', observationId);

      // Removed toast - observation appears in list automatically
      await loadObservations(tripId);

      if (observationId) {
        console.log('[DEBUG] Starting camera window for observation:', observationId);
        startCameraWindow(observationId);
      } else {
        console.warn('[DEBUG] No observation ID returned, camera window not started');
      }
    } catch (e) {
      console.warn('Manual observation failed:', e);
      showToast('Failed to record/save observation');
    } finally {
      setSavingManualObservation(false);
    }
  }, [tripId, isRecording, recorder, savingManualObservation, loadObservations, startCameraWindow]);

  // Open camera for the last observation
  const onOpenCameraPress = useCallback(() => {
    if (!lastObservationId) return;

    router.push({
      pathname: '/camera-capture',
      params: { observationId: lastObservationId },
    });
  }, [lastObservationId, router]);

  // End journey button
  const onEndJourneyPress = useCallback(async () => {
    console.log('[DEBUG] End journey pressed, tripId:', tripId);

    if (!tripId) {
      showToast('No active journey to end.');
      return;
    }

    if (endingJourney) {
      console.log('[DEBUG] Already ending journey, ignoring');
      return;
    }

    try {
      setEndingJourney(true);
      console.log('[DEBUG] Starting end journey process');
      showToast('Ending journey and transcribing audio...');

      const endCoordinates = await getCurrentCoordinates();
      console.log('[DEBUG] Got end coordinates:', endCoordinates);

      await updateTripById(tripId, {
        end_time: Date.now(),
        end_latitude: endCoordinates.latitude,
        end_longitude: endCoordinates.longitude,
      });
      console.log('[DEBUG] Updated trip');

      // Stop location tracking when journey ends, regardless of success or failure
      stopLocationTracking();

      await transcribeTripAudio(tripId);
      console.log('[DEBUG] Transcription complete');

      // Clear the active trip from storage so a new one can be created next time
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      console.log('[DEBUG] Cleared active trip from storage');

      showToast('Journey ended. Transcriptions complete!');

      console.log('[DEBUG] Navigating to: /review/' + tripId);
      router.push(`/review/${tripId}`);
      console.log('[DEBUG] Navigation called');
    } catch (error) {
      console.error('[JourneyScreen] Failed to end journey:', error);
      showToast('Failed to end journey. Please try again.');
    } finally {
      setEndingJourney(false);
    }
  }, [tripId, router, endingJourney]);

  const obsCount = observations.length;
  const manualDisabled = !tripId;
  const endJourneyDisabled = !tripId || endingJourney;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Current Journey</Text>
          <Text style={styles.timerText}>{formatDuration(secondsElapsed)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#55A7FF' }]}>{obsCount}</Text>
              <Text style={styles.statLabel}>Observations</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#A78BFA' }]}>{photoCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFB020' }]}>{videoCount}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </View>

        {/* Listening banner */}
        <ListeningBanner text={`Listening for "Hey WaDE"`} />

        {/* Manual Observation card */}
        <Pressable
          disabled={manualDisabled}
          onPress={onManualObservationPress}
          style={({ pressed }) => [
            styles.card,
            styles.manualObservationCard,
            manualDisabled ? { opacity: 0.6 } : null,
            pressed && !manualDisabled ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.manualObservationTitle}>
            {savingManualObservation
              ? 'Saving…'
              : isRecording
                ? 'Tap to Stop & Save'
                : 'Start Observation'}
          </Text>
          <Text style={styles.manualObservationSubtitle}>
            {isRecording
              ? 'Recording is active. Tap again to save this observation.'
              : 'Tap to record an observation.'}
          </Text>
        </Pressable>

        {/* Camera card - only visible for 10 seconds after observation */}
        {cameraWindowActive && (
          <>
            {console.log(
              '[DEBUG] RENDERING CAMERA BUTTON - Active:',
              cameraWindowActive,
              'Seconds:',
              cameraWindowSecondsLeft
            )}
            <Pressable
              onPress={onOpenCameraPress}
              style={({ pressed }) => [
                styles.card,
                styles.cameraCard,
                pressed ? { opacity: 0.85 } : null,
              ]}
            >
              <Text style={styles.cameraText}>📸 Add Photo/Video</Text>
              <Text style={styles.cameraSubtext}>
                Available for {cameraWindowSecondsLeft} more second
                {cameraWindowSecondsLeft !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          </>
        )}

        {/* End Journey card */}
        <Pressable
          onPress={onEndJourneyPress}
          disabled={endJourneyDisabled}
          style={({ pressed }) => [
            styles.card,
            styles.endJourneyCard,
            endJourneyDisabled ? { opacity: 0.6 } : null,
            pressed && !endJourneyDisabled ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.endJourneyLabel}>
            {endingJourney ? 'Transcribing...' : 'End Journey'}
          </Text>
        </Pressable>

        {/* Recent Observations */}
        <Text style={styles.sectionTitle}>Recent Observations</Text>

        {loadingObservations ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {observations.slice(0, 6).map((o, idx) => (
              <RecentObservationItem
                key={o.id}
                title={`Observation #${obsCount - idx}`}
                subtitle={o.created_at ? new Date(o.created_at).toLocaleString() : undefined}
                onPress={() => console.log('Pressed observation', o.id)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
