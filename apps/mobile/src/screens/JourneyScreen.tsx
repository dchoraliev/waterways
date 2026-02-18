import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecentObservationItem } from '../components/RecentObservationItem';
import { styles } from '../styles/JourneyScreen.styles';

import { updateTripById } from '../database/TripManager';
import { getObservationsByTripId } from '../database/ObservationManager';
import { getTripById } from '../database/TripManager';

import { getCurrentUserId } from '../services/AuthService';
import { getCurrentCoordinates, stopLocationTracking } from '../services/LocationService';
import { transcribeTripAudio } from '../services/TranscriptionService';
import { showToast } from '../utils/toast';
import { isExpoGo } from '../utils/platformDetection';

// expo-audio (NOT expo-av)
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { saveAudioObservationForTrip } from '../services/VoiceRecorder';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMediaCountsForTrip } from '../services/MediaQueries';
import { useWakeWord } from '../hooks/useWakeWord';
import type { WakeWordMatch } from '../utils/stringMatching';

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

  // --- Audio recording state ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  const isRecording = !!recState?.isRecording;
  const [recordingCountdown, setRecordingCountdown] = useState(0); // 0 = not recording, 1-15 = countdown
  const recordingCountdownRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);
  const processingWakeWordRef = useRef(false);

  // --- Wake word state ---
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  // --- End journey state ---
  const [endingJourney, setEndingJourney] = useState(false);

  // --- Camera window state (10 seconds after observation) ---
  const [cameraWindowActive, setCameraWindowActive] = useState(false);
  const [cameraWindowSecondsLeft, setCameraWindowSecondsLeft] = useState(0);
  const [lastObservationId, setLastObservationId] = useState<string | null>(null);
  // eslint-disable-next-line no-undef
  const cameraWindowTimerRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncJourneyStart = async () => {
      if (!tripId) return;

      try {
        const trip = await getTripById(tripId);
        const startTime = trip?.start_time ?? Date.now();
        journeyStartRef.current = startTime;

        if (mounted) {
          setSecondsElapsed(Math.max(0, (Date.now() - startTime) / 1000));
        }
      } catch (error) {
        console.warn('[JourneyScreen] Failed to restore journey start time:', error);
      }
    };

    void syncJourneyStart();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    const t = globalThis.setInterval(() => {
      const s = (Date.now() - journeyStartRef.current) / 1000;
      setSecondsElapsed(s);
    }, 1000);
    return () => globalThis.clearInterval(t);
  }, []);

  // --- Wake word integration ---
  const configureIdleAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch (error) {
      console.warn('[JourneyScreen] Failed to reset audio mode:', error);
    }
  }, []);

  const wakeWord = useWakeWord({
    wakeWord: 'hey wade start recording',
    threshold: 0.85,
    locale: 'en-US',
    continuous: true,
    recordingDelayMs: 0, // We handle recording ourselves with expo-audio
    recordingDurationMs: 0, // Disable useWakeWord's built-in recording
    onWakeWordDetected: (_match: WakeWordMatch) => {
      // Only process if not already recording
      if (processingWakeWordRef.current || isRecording || recordingCountdown > 0) {
        return;
      }

      // Start 15-second recording countdown
      startObservationRecording();
    },
    onError: (error) => {
      if (!error.isRecoverable) {
        console.error('[JourneyScreen] Wake word error:', error);
      }
    },
    onStateChange: () => {
      // State changes handled internally
    },
  });

  // Store wake word control functions in refs to avoid dependency issues
  const wakeWordStartRef = useRef(wakeWord.startListening);
  const wakeWordStopRef = useRef(wakeWord.stop);

  useEffect(() => {
    wakeWordStartRef.current = wakeWord.startListening;
    wakeWordStopRef.current = wakeWord.stop;
  });

  useEffect(() => {
    console.log('[JourneyScreen] Wake status', {
      platform: Platform.OS,
      expoGo: isExpoGo(),
      wakeWordAvailable: wakeWord.isAvailable,
      wakeWordEnabled,
      wakeWordState: wakeWord.state,
      wakeWordError: wakeWord.lastError?.message ?? null,
    });
  }, [wakeWord.isAvailable, wakeWordEnabled, wakeWord.state, wakeWord.lastError]);

  useFocusEffect(
    useCallback(() => {
      const shouldEnableWakeWord = Platform.OS === 'android' && !isExpoGo() && wakeWord.isAvailable;

      if (!shouldEnableWakeWord) {
        setWakeWordEnabled(false);
        return;
      }

      let active = true;
      (async () => {
        try {
          await configureIdleAudioMode();
          await wakeWordStopRef.current();
        } catch {
          // noop
        }

        const started = await wakeWordStartRef.current();
        if (active) {
          setWakeWordEnabled(started);
        }
      })();

      return () => {
        active = false;
        setWakeWordEnabled(false);
        void wakeWordStopRef.current();
      };
    }, [wakeWord.isAvailable, configureIdleAudioMode])
  );

  // Start observation recording with 15-second countdown
  const startObservationRecording = useCallback(async () => {
    if (!tripId || processingWakeWordRef.current || isRecording) return;

    processingWakeWordRef.current = true;

    try {
      // Check permissions
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        showToast('Microphone permission required');
        processingWakeWordRef.current = false;
        return;
      }

      // Set audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Reset recorder
      try {
        await recorder.stop();
      } catch (_err) {
        // Ignore
      }

      await recorder.prepareToRecordAsync();
      await recorder.record();

      // Start 15-second countdown
      setRecordingCountdown(15);
      recordingCountdownRef.current = globalThis.setInterval(() => {
        setRecordingCountdown((prev) => {
          if (prev <= 1) {
            // Countdown finished, stop recording
            void stopObservationRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('[JourneyScreen] Failed to start recording:', e);
      showToast('Failed to start recording');
      processingWakeWordRef.current = false;
      setRecordingCountdown(0);
    }
  }, [tripId, isRecording, recorder]);

  // Stop observation recording and save
  const stopObservationRecording = useCallback(async () => {
    // Clear countdown timer
    if (recordingCountdownRef.current) {
      globalThis.clearInterval(recordingCountdownRef.current);
      recordingCountdownRef.current = null;
    }
    setRecordingCountdown(0);

    try {
      await recorder.stop();

      const fileUri = recorder.uri;
      if (!fileUri) {
        showToast('Recording failed');
        processingWakeWordRef.current = false;
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        showToast('Not logged in');
        processingWakeWordRef.current = false;
        return;
      }

      const observationId = await saveAudioObservationForTrip(tripId, userId, fileUri);
      await loadObservations(tripId);

      if (observationId) {
        startCameraWindow(observationId);
      }
    } catch (e) {
      console.error('[JourneyScreen] Failed to save observation:', e);
      showToast('Failed to save observation');
    } finally {
      await configureIdleAudioMode();
      processingWakeWordRef.current = false;
    }
  }, [tripId, recorder, configureIdleAudioMode]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (recordingCountdownRef.current) {
        globalThis.clearInterval(recordingCountdownRef.current);
      }
    };
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
    // Clear any existing timer
    if (cameraWindowTimerRef.current) {
      globalThis.clearInterval(cameraWindowTimerRef.current);
    }

    setLastObservationId(observationId);
    setCameraWindowActive(true);
    setCameraWindowSecondsLeft(10);

    // Countdown timer
    cameraWindowTimerRef.current = globalThis.setInterval(() => {
      setCameraWindowSecondsLeft((prev) => {
        if (prev <= 1) {
          if (cameraWindowTimerRef.current) {
            globalThis.clearInterval(cameraWindowTimerRef.current);
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
        globalThis.clearInterval(cameraWindowTimerRef.current);
      }
    };
  }, []);

  // Start observation button
  const onStartObservationPress = useCallback(async () => {
    if (recordingCountdown > 0) {
      // Stop recording early
      await stopObservationRecording();
    } else {
      // Start recording
      await startObservationRecording();
    }
  }, [recordingCountdown, startObservationRecording, stopObservationRecording]);

  // Open camera for the last observation
  const onOpenCameraPress = useCallback(async () => {
    if (!lastObservationId) return;

    setWakeWordEnabled(false);
    await wakeWordStopRef.current();

    router.push({
      pathname: '/camera-capture',
      params: { observationId: lastObservationId },
    });
  }, [lastObservationId, router]);

  // End journey button
  const onEndJourneyPress = useCallback(async () => {
    if (!tripId) {
      showToast('No active journey to end.');
      return;
    }

    if (endingJourney) {
      return;
    }

    try {
      setEndingJourney(true);
      showToast('Ending journey and transcribing audio...');

      const endCoordinates = await getCurrentCoordinates();

      await updateTripById(tripId, {
        end_time: Date.now(),
        end_latitude: endCoordinates.latitude,
        end_longitude: endCoordinates.longitude,
      });

      // Stop location tracking when journey ends, regardless of success or failure
      stopLocationTracking();

      await transcribeTripAudio(tripId);

      // Clear the active trip from storage so a new one can be created next time
      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);

      showToast('Journey ended. Transcriptions complete!');
      router.push(`/review/${tripId}`);
    } catch (error) {
      console.error('[JourneyScreen] Failed to end journey:', error);
      showToast('Failed to end journey. Please try again.');
    } finally {
      setEndingJourney(false);
    }
  }, [tripId, router, endingJourney]);

  const obsCount = observations.length;
  const shouldRenderWakeWordStatus = Platform.OS === 'android';
  const wakeWordStatusText = isExpoGo()
    ? 'Wake word disabled in Expo Go'
    : recordingCountdown > 0
      ? 'Recording observation...'
      : !wakeWord.isAvailable
        ? 'Wake word unavailable in this build/device'
        : wakeWordEnabled
          ? '💡 Say “Hey Wade, Start Recording”'
          : wakeWord.lastError
            ? `Wake word failed: ${wakeWord.lastError.message ?? 'Unknown error'}`
            : 'Wake word is starting…';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
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

        {/* Wake word listening tooltip */}
        {shouldRenderWakeWordStatus && (
          <View style={styles.wakeWordStatusBanner}>
            <Text style={styles.wakeWordStatusText}>{wakeWordStatusText}</Text>
          </View>
        )}

        {/* Recording countdown timer */}
        {recordingCountdown > 0 && (
          <View style={styles.recordingCountdownCard}>
            <Text style={styles.recordingCountdownNumber}>{recordingCountdown}</Text>
            <Text style={styles.recordingCountdownLabel}>Recording observation...</Text>
            <Text style={styles.recordingCountdownSubtext}>
              Tap &ldquo;Stop Recording&rdquo; to finish early
            </Text>
          </View>
        )}

        {/* Start Observation button */}
        <Pressable
          onPress={onStartObservationPress}
          disabled={processingWakeWordRef.current && recordingCountdown === 0}
          style={({ pressed }) => [
            styles.card,
            styles.observationButton,
            processingWakeWordRef.current && recordingCountdown === 0 ? { opacity: 0.6 } : null,
            pressed && !(processingWakeWordRef.current && recordingCountdown === 0)
              ? { opacity: 0.85 }
              : null,
          ]}
        >
          <Text style={styles.observationButtonText}>
            {recordingCountdown > 0 ? '⏹ Stop Recording' : '🎙 Start Observation'}
          </Text>
        </Pressable>

        {/* Camera card - only visible for 10 seconds after observation */}
        {cameraWindowActive && (
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
        )}

        {/* End Journey button */}
        <Pressable
          onPress={onEndJourneyPress}
          disabled={endingJourney || recordingCountdown > 0}
          style={({ pressed }) => [
            styles.card,
            styles.endJourneyCard,
            endingJourney || recordingCountdown > 0 ? { opacity: 0.6 } : null,
            pressed && !endingJourney && recordingCountdown === 0 ? { opacity: 0.85 } : null,
          ]}
        >
          <Text style={styles.endJourneyLabel}>
            {endingJourney ? 'Ending Journey...' : '🏁 End Journey'}
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
    </SafeAreaView>
  );
}
