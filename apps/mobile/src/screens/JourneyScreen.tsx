import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecentObservationItem } from '../components/RecentObservationItem';
import { createJourneyScreenStyles } from '../styles/JourneyScreen.styles';

import { updateTripById, getTripById, removeTripById } from '../database/TripManager';
import { getObservationsByTripId } from '../database/ObservationManager';
import { SyncStatus } from '../database/SyncStatus';

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
import { useTheme } from '../contexts/ThemeContext';
import { ROUTES } from '../constants/routes';

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
  readonly tripId: string;
}

export default function JourneyScreen({ tripId }: JourneyScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createJourneyScreenStyles(colors), [colors]);
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

  // Ref mirror of isRecording — avoids stale closure issues in onWakeWordDetected.
  // React state updates are async; by the time the wake word fires after a
  // recording stops, the inline callback may still see the old isRecording value.
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const [recordingCountdown, setRecordingCountdown] = useState(0);
  const recordingCountdownRef = useRef(0); // ref mirror for same reason
  const recordingCountdownTimerRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);
  const processingWakeWordRef = useRef(false);
  const stopObservationRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const loadObservationsRef = useRef<((activeTripId: string) => Promise<void>) | null>(null);
  const startCameraWindowRef = useRef<((observationId: string) => void) | null>(null);

  // Keep recordingCountdownRef in sync
  useEffect(() => {
    recordingCountdownRef.current = recordingCountdown;
  }, [recordingCountdown]);

  // --- Wake word state ---
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);

  // --- End journey state ---
  const [endingJourney, setEndingJourney] = useState(false);
  const [tripIsActive, setTripIsActive] = useState(true);

  // --- Camera window state (10 seconds after observation) ---
  const [cameraWindowActive, setCameraWindowActive] = useState(false);
  const [cameraWindowSecondsLeft, setCameraWindowSecondsLeft] = useState(0);
  const [lastObservationId, setLastObservationId] = useState<string | null>(null);

  const cameraWindowTimerRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncJourneyStart = async () => {
      if (!tripId) return;

      try {
        const trip = await getTripById(tripId);
        const active = !trip?.end_time;
        setTripIsActive(active);

        if (!active) {
          setWakeWordEnabled(false);
          return;
        }

        const startTime = trip?.start_time ?? Date.now();
        journeyStartRef.current = startTime;

        if (mounted) {
          setSecondsElapsed(Math.max(0, (Date.now() - startTime) / 1000));
        }
      } catch (error) {
        console.warn('[JourneyScreen] Failed to restore journey start time:', error);
        setTripIsActive(false);
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

  // --- Audio session helpers ---
  //
  // iOS has one shared audio session. Both @react-native-voice/voice and
  // expo-audio compete for it. The safe ownership cycle is:
  //
  //   START RECORDING:
  //     1. wakeWordStop()          — voice releases the session
  //     2. setAudioMode(recording) — expo-audio claims it
  //     3. recorder.record()
  //
  //   STOP RECORDING:
  //     1. recorder.stop()         — expo-audio finishes
  //     2. setAudioMode(playback)  — reset category (150ms delay for release)
  //     3. wakeWordStart()         — voice claims it again
  //
  // Never call setAudioModeAsync while either session is active.

  const configureRecordingAudioMode = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
  }, []);

  const configureIdleAudioMode = useCallback(async () => {
    try {
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 150));
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
    recordingDelayMs: 0,
    recordingDurationMs: 0, // We handle recording ourselves with expo-audio
    onWakeWordDetected: (_match: WakeWordMatch) => {
      // Use refs here — this callback is an inline function and would capture
      // stale React state values (isRecording, recordingCountdown) from the
      // render in which useWakeWord was last called.
      if (
        processingWakeWordRef.current ||
        isRecordingRef.current ||
        recordingCountdownRef.current > 0
      ) {
        console.log('[JourneyScreen] Wake word ignored — already recording or processing');
        return;
      }
      startObservationRecording();
    },
    onError: (error) => {
      if (error.isRecoverable) {
        return;
      }

      // FIXED: Don't log "No speech detected" errors - these are normal during silent periods
      const isNoSpeechError =
        error.message?.includes('1110') ||
        error.message?.toLowerCase().includes('no speech detected');

      if (isNoSpeechError) {
        // Silent period - not a real error
        return;
      }

      console.error('[JourneyScreen] Wake word error:', error);
    },
    onStateChange: () => {
      // State changes handled internally
    },
  });

  // Store wake word control functions in refs to avoid stale closure issues
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
      const shouldEnableWakeWord = tripIsActive && !isExpoGo() && wakeWord.isAvailable;

      if (!shouldEnableWakeWord) {
        setWakeWordEnabled(false);
        void wakeWordStopRef.current();
        return;
      }

      let active = true;
      (async () => {
        try {
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
    }, [tripIsActive, wakeWord.isAvailable])
  );

  // Start observation recording with 20-second countdown.
  // Stops the wake word listener first so expo-audio can safely claim
  // the iOS audio session.
  const startObservationRecording = useCallback(async () => {
    if (!tripId || processingWakeWordRef.current || isRecordingRef.current) return;

    processingWakeWordRef.current = true;

    try {
      // Check permissions
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        showToast('Microphone permission required');
        processingWakeWordRef.current = false;
        return;
      }

      // Step 1: stop voice session so it releases the audio session
      await wakeWordStopRef.current();

      // Step 2: claim the session for recording
      await configureRecordingAudioMode();

      // Step 2.5: Reset recorder if it's in a bad state
      try {
        // Stop any existing recording
        if (recState?.isRecording) {
          await recorder.stop();
        }
        // Give the system a moment to fully release the previous recording
        await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
      } catch (resetError) {
        console.log('[JourneyScreen] Recorder reset (expected):', resetError);
      }

      // Step 3: prepare and start recording
      await recorder.prepareToRecordAsync();
      await recorder.record();

      // Start 20-second countdown
      setRecordingCountdown(20);
      recordingCountdownRef.current = 20;
      recordingCountdownTimerRef.current = globalThis.setInterval(() => {
        setRecordingCountdown((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          recordingCountdownRef.current = next;
          if (next === 0) {
            void stopObservationRecordingRef.current?.();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      console.error('[JourneyScreen] Failed to start recording:', e);
      showToast('Failed to start recording');
      processingWakeWordRef.current = false;
      setRecordingCountdown(0);
      recordingCountdownRef.current = 0;
      // Restart wake word since we stopped it above
      void wakeWordStartRef.current();
    }
  }, [tripId, recorder, configureRecordingAudioMode, recState]);

  // Stop observation recording and save.
  // Resets the audio session and hands it back to the wake word listener.
  const stopObservationRecording = useCallback(async () => {
    // Clear countdown timer
    if (recordingCountdownTimerRef.current) {
      globalThis.clearInterval(recordingCountdownTimerRef.current);
      recordingCountdownTimerRef.current = null;
    }
    setRecordingCountdown(0);
    recordingCountdownRef.current = 0;

    try {
      // Step 1: stop recorder
      await recorder.stop();

      const fileUri = recorder.uri;
      if (!fileUri) {
        showToast('Recording failed');
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        showToast('Not logged in');
        return;
      }

      const observationId = await saveAudioObservationForTrip(tripId, userId, fileUri);
      await loadObservationsRef.current?.(tripId);

      if (observationId) {
        startCameraWindowRef.current?.(observationId);
      }
    } catch (e) {
      console.error('[JourneyScreen] Failed to save observation:', e);
      showToast('Failed to save observation');
    } finally {
      // Step 2: reset audio category now that expo-audio has released it
      await configureIdleAudioMode();
      // Step 3: hand the session back to the wake word listener
      await wakeWordStartRef.current();
      processingWakeWordRef.current = false;
    }
  }, [tripId, recorder, configureIdleAudioMode]);

  useEffect(() => {
    stopObservationRecordingRef.current = stopObservationRecording;
  }, [stopObservationRecording]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (recordingCountdownTimerRef.current) {
        globalThis.clearInterval(recordingCountdownTimerRef.current);
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
    loadObservationsRef.current = loadObservations;
  }, [loadObservations]);

  useEffect(() => {
    if (!tripId) return;
    void loadObservations(tripId);
  }, [tripId, loadObservations]);

  // Start 10-second camera window
  const startCameraWindow = useCallback((observationId: string) => {
    if (cameraWindowTimerRef.current) {
      globalThis.clearInterval(cameraWindowTimerRef.current);
    }

    setLastObservationId(observationId);
    setCameraWindowActive(true);
    setCameraWindowSecondsLeft(10);

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

  useEffect(() => {
    startCameraWindowRef.current = startCameraWindow;
  }, [startCameraWindow]);

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
      await stopObservationRecording();
    } else {
      await startObservationRecording();
    }
  }, [recordingCountdown, startObservationRecording, stopObservationRecording]);

  // Open camera for the last observation
  const onOpenCameraPress = useCallback(async () => {
    if (!lastObservationId) return;

    setWakeWordEnabled(false);
    await wakeWordStopRef.current();

    router.push({
      pathname: ROUTES.cameraCapture,
      params: {
        observationId: lastObservationId,
        secondsElapsed: String(Math.floor(secondsElapsed)),
      },
    });
  }, [lastObservationId, secondsElapsed, router]);

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
      setWakeWordEnabled(false);
      setTripIsActive(false);
      await wakeWordStopRef.current();

      // Check if trip has any observations
      const observationCount = observations.length;

      if (observationCount === 0) {
        // Stop location tracking
        stopLocationTracking();

        // Clear the active trip from storage
        await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);

        // Delete the empty trip from database
        await removeTripById(tripId);

        // Alert user that trip wasn't saved
        Alert.alert(
          'Journey Not Saved',
          'Your journey was not saved because it contains no observations.',
          [{ text: 'OK', onPress: () => router.replace(ROUTES.home) }],
          { cancelable: false }
        );

        return;
      }

      // Journey has observations - save as draft and proceed
      showToast('Ending journey and transcribing audio...');

      const endCoordinates = await getCurrentCoordinates();

      // FIXED: Automatically save as draft when ending journey
      await updateTripById(tripId, {
        end_time: Date.now(),
        end_latitude: endCoordinates.latitude,
        end_longitude: endCoordinates.longitude,
        sync_status: SyncStatus.DRAFTED, // ✅ Auto-save as draft
      });

      stopLocationTracking();

      await transcribeTripAudio(tripId);

      await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);

      showToast('Journey saved. Review and submit when ready!');
      router.push(`/review/${tripId}`);
    } catch (error) {
      console.error('[JourneyScreen] Failed to end journey:', error);
      showToast('Failed to end journey. Please try again.');
    } finally {
      setEndingJourney(false);
    }
  }, [tripId, router, endingJourney, observations]);

  const obsCount = observations.length;
  const shouldRenderWakeWordStatus = true;
  const wakeWordStatusText = isExpoGo()
    ? 'Wake word disabled in Expo Go'
    : recordingCountdown > 0
      ? 'Recording observation...'
      : !wakeWord.isAvailable
        ? 'Wake word unavailable in this build/device'
        : wakeWordEnabled
          ? '💡 Say "Hey Wade, Start Recording"'
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
              <Text style={[styles.statValue, { color: colors.primary }]}>{obsCount}</Text>
              <Text style={styles.statLabel}>Observations</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#A78BFA' }]}>{photoCount}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{videoCount}</Text>
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
            <ActivityIndicator color={colors.textMuted} />
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
