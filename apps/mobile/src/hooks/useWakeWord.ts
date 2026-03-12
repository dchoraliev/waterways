/**
 * useWakeWord - Production-grade React hook for wake word detection
 *
 * This hook provides a complete wake word detection solution with:
 * - Continuous listening for wake word
 * - Automatic transition to recording mode after detection
 * - Robust error handling and recovery
 * - Proper cleanup and lifecycle management
 *
 * Wake word detection is handled entirely by VoiceRecognitionService.
 * This hook reacts to onWakeWordDetected callbacks and manages the
 * recording lifecycle — it does NOT do its own speech matching.
 *
 * Usage:
 * ```tsx
 * const wakeWord = useWakeWord({
 *   wakeWord: 'hey wade start recording',
 *   onWakeWordDetected: () => console.log('Wake word detected!'),
 *   onTranscript: (text) => console.log('Transcribed:', text),
 * });
 *
 * // Start listening
 * await wakeWord.startListening();
 *
 * // Stop
 * await wakeWord.stop();
 * ```
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import VoiceRecognitionService, {
  RecognitionResult,
  RecognitionError,
  RecognitionState,
} from '../services/VoiceRecognitionService';
import AudioRecordingService, {
  RecordingResult,
  RecordingStopReason,
} from '../services/AudioRecordingService';
import { WakeWordMatch } from '../utils/stringMatching';
import { hasNativeModules } from '../utils/platformDetection';

export type WakeWordState =
  | 'idle' // Not active
  | 'initializing' // Starting up
  | 'listening' // Listening for wake word
  | 'detected' // Wake word detected, transitioning
  | 'recording' // Recording user's command/input
  | 'processing' // Processing final results
  | 'error'; // Error state

export interface WakeWordConfig {
  wakeWord: string;
  threshold?: number;
  locale?: string;
  continuous?: boolean;
  maxAlternatives?: number;
  onWakeWordDetected?: (match: WakeWordMatch) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: RecognitionError) => void;
  onStateChange?: (state: WakeWordState) => void;
  onRecordingComplete?: (recording: RecordingResult) => void;
  recordingDelayMs?: number;
  recordingDurationMs?: number;
}

export interface WakeWordControls {
  // Control methods
  startListening: () => Promise<boolean>;
  stop: () => Promise<void>;
  reset: () => void;

  // State
  state: WakeWordState;
  isListening: boolean;
  isRecording: boolean;
  isAvailable: boolean;
  isAudioRecording: boolean;

  // Results
  partialTranscript: string;
  finalTranscript: string;
  lastWakeWordMatch: WakeWordMatch | null;
  lastError: RecognitionError | null;
  recording: {
    uri: string | null;
    durationMillis: number;
    reason: RecordingStopReason | null;
    startedAt: number | null;
    endedAt: number | null;
  };
  recordings: RecordingResult[];

  // Debugging
  debugInfo: {
    consecutiveErrors: number;
    totalDetections: number;
    lastDetectionTime: number | null;
  };

  // Advanced features
  voiceService: VoiceRecognitionService | null;
}

export function useWakeWord(config: WakeWordConfig): WakeWordControls {
  const {
    wakeWord,
    threshold = 0.85,
    locale = 'en-US',
    continuous = true,
    maxAlternatives = 5,
    onWakeWordDetected,
    onTranscript,
    onError,
    onStateChange,
    onRecordingComplete,
    recordingDelayMs = 1000,
    recordingDurationMs = 10000,
  } = config;

  const EXTERNAL_RECORDING_COOLDOWN_MS = 1200;

  // State
  const [state, setState] = useState<WakeWordState>('idle');
  const [isAvailable, setIsAvailable] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [lastWakeWordMatch, setLastWakeWordMatch] = useState<WakeWordMatch | null>(null);
  const [lastError, setLastError] = useState<RecognitionError | null>(null);
  const [recordings, setRecordings] = useState<RecordingResult[]>([]);
  const [currentRecording, setCurrentRecording] = useState({
    uri: null as string | null,
    durationMillis: 0,
    reason: null as RecordingStopReason | null,
    startedAt: null as number | null,
    endedAt: null as number | null,
  });
  const [isAudioRecording, setIsAudioRecording] = useState(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    consecutiveErrors: 0,
    totalDetections: 0,
    lastDetectionTime: null as number | null,
  });

  // Refs for stable references
  const voiceService = useRef(VoiceRecognitionService.getInstance());
  const audioService = useRef(AudioRecordingService.getInstance());
  const isRecordingMode = useRef(false);
  const transitionTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const recordingStartTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const recordingStopTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const ignoreResultsRef = useRef(false);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Update state with callback
  const updateState = useCallback((newState: WakeWordState) => {
    setState(newState);
    onStateChangeRef.current?.(newState);
  }, []);

  const clearRecordingTimers = useCallback(() => {
    if (recordingStartTimeout.current) {
      globalThis.clearTimeout(recordingStartTimeout.current);
      recordingStartTimeout.current = null;
    }
    if (recordingStopTimeout.current) {
      globalThis.clearTimeout(recordingStopTimeout.current);
      recordingStopTimeout.current = null;
    }
  }, []);

  const stopAudioRecording = useCallback(
    async (reason: RecordingStopReason) => {
      const service = audioService.current;
      clearRecordingTimers();

      try {
        if (service.isRecording()) {
          const result = await service.stopRecording(reason);
          setIsAudioRecording(false);

          if (result) {
            setCurrentRecording(result);
            setRecordings((prev) => [result, ...prev]);
            onRecordingComplete?.(result);
          } else {
            setCurrentRecording((prev) => ({
              ...prev,
              reason,
              endedAt: Date.now(),
            }));
          }
        } else {
          setCurrentRecording((prev) => ({
            ...prev,
            reason,
            endedAt: Date.now(),
          }));
          setIsAudioRecording(false);
        }
      } catch (error) {
        console.error('[useWakeWord] Failed to stop audio recording:', error);
      } finally {
        isRecordingMode.current = false;
        ignoreResultsRef.current = true;
        updateState('processing');
      }
    },
    [clearRecordingTimers, onRecordingComplete, updateState]
  );

  const startAudioRecording = useCallback(async () => {
    try {
      await audioService.current.startRecording();
      setIsAudioRecording(true);
      const startedAt = Date.now();
      setCurrentRecording({
        uri: null,
        durationMillis: 0,
        reason: null,
        startedAt,
        endedAt: null,
      });
      if (recordingDurationMs > 0) {
        recordingStopTimeout.current = globalThis.setTimeout(() => {
          recordingStopTimeout.current = null;
          void stopAudioRecording('timeout');
        }, recordingDurationMs);
      }
    } catch (error) {
      console.error('[useWakeWord] Failed to start audio recording:', error);
      isRecordingMode.current = false;
      updateState('error');
    }
  }, [recordingDurationMs, stopAudioRecording, updateState]);

  const triggerWakeWordFlow = useCallback(
    (match: WakeWordMatch) => {
      setLastWakeWordMatch(match);
      setDebugInfo((prev) => ({
        ...prev,
        totalDetections: prev.totalDetections + 1,
        lastDetectionTime: Date.now(),
      }));

      updateState('detected');
      onWakeWordDetected?.(match);
      setPartialTranscript('');
      setFinalTranscript('');
      clearRecordingTimers();

      if (recordingDurationMs <= 0) {
        // External recording mode
        isRecordingMode.current = false;
        ignoreResultsRef.current = true;

        const cooldownMs = Math.max(recordingDelayMs, EXTERNAL_RECORDING_COOLDOWN_MS);
        transitionTimeout.current = globalThis.setTimeout(() => {
          transitionTimeout.current = null;
          ignoreResultsRef.current = false;
          updateState('listening');
        }, cooldownMs);
        return;
      }

      isRecordingMode.current = true;
      ignoreResultsRef.current = false;

      transitionTimeout.current = globalThis.setTimeout(() => {
        updateState('recording');
        transitionTimeout.current = null;
      }, recordingDelayMs);

      recordingStartTimeout.current = globalThis.setTimeout(() => {
        void startAudioRecording();
        recordingStartTimeout.current = null;
      }, recordingDelayMs);
    },
    [
      clearRecordingTimers,
      onWakeWordDetected,
      recordingDelayMs,
      recordingDurationMs,
      startAudioRecording,
      updateState,
    ]
  );

  // Called by VoiceRecognitionService when wake word is confirmed.
  // This is the single entry point for wake word detection — the hook
  // does NOT do its own speech matching.
  const handleWakeWordDetected = useCallback(() => {
    console.log('[useWakeWord] Wake word confirmed by service');
    const match: WakeWordMatch = {
      isMatch: true,
      confidence: 1,
      stage: 'full',
    };
    triggerWakeWordFlow(match);
  }, [triggerWakeWordFlow]);

  // Handle final recognition results — command transcription only.
  // Wake word detection has already been handled by the service.
  const handleResults = useCallback(
    (results: RecognitionResult[]) => {
      if (results.length === 0) return;
      if (ignoreResultsRef.current) return;

      const text = results[0].text;
      console.log(`[useWakeWord] Command result: "${text}"`);

      if (isRecordingMode.current) {
        setFinalTranscript(text);
        onTranscript?.(text, true);

        if (!continuous) {
          updateState('processing');
          voiceService.current.stop();
        }
      }
      // No wake word check here — the service handles that before onResults fires
    },
    [continuous, onTranscript, updateState]
  );

  // Handle partial results — transcription only, no wake word matching.
  const handlePartialResults = useCallback(
    (results: RecognitionResult[]) => {
      if (results.length === 0) return;
      if (ignoreResultsRef.current) return;
      if (!isRecordingMode.current) return; // no partials during wake word listening phase

      const text = results[0].text;
      setPartialTranscript(text);
      onTranscript?.(text, false);
    },
    [onTranscript]
  );

  // Handle errors
  const handleError = useCallback(
    (error: RecognitionError) => {
      // Ignore "no speech detected" timeout - this is a normal part of continuous listening
      if (error.code === 'recognition_fail' && error.message?.includes('No speech detected')) {
        return;
      }

      if (error.isRecoverable) {
        if (isRecordingMode.current) {
          isRecordingMode.current = false;
          updateState('listening');
        }
        return;
      }

      // FIXED: Don't log "No speech detected" errors - these are normal during silent periods
      const isNoSpeechError =
        error.message?.includes('1110') ||
        error.message?.toLowerCase().includes('no speech detected');

      if (isNoSpeechError) {
        // Treat as recoverable even if marked otherwise
        if (isRecordingMode.current) {
          isRecordingMode.current = false;
          updateState('listening');
        }
        return;
      }

      console.error('[useWakeWord] Error:', error);

      setLastError(error);
      onError?.(error);

      setDebugInfo((prev) => ({
        ...prev,
        consecutiveErrors: prev.consecutiveErrors + 1,
      }));

      updateState('error');
    },
    [onError, updateState]
  );

  // Handle state changes from service
  const handleServiceStateChange = useCallback(
    (serviceState: RecognitionState) => {
      switch (serviceState) {
        case 'idle':
          if (state !== 'idle') {
            updateState('idle');
          }
          break;
        case 'initializing':
          updateState('initializing');
          break;
        case 'listening':
          if (!isRecordingMode.current) {
            if (!ignoreResultsRef.current) {
              updateState('listening');
            }
          }
          break;
        case 'error':
          updateState('error');
          break;
      }
    },
    [state, updateState]
  );

  // Initialize service
  useEffect(() => {
    const recognitionService = voiceService.current;
    const recordingService = audioService.current;

    const init = async () => {
      if (!hasNativeModules()) {
        setIsAvailable(false);
        updateState('idle');
        return;
      }

      const success = await recognitionService.initialize({
        locale,
        continuous: true,
        maxAlternatives,
        returnPartialResults: true,
        wakeWord,
        wakeWordThreshold: threshold,
      });

      setIsAvailable(success);

      if (!success) {
        updateState('error');
      }
    };

    void init();

    return () => {
      if (recognitionService.isListening()) {
        recognitionService.stop();
      }
      if (transitionTimeout.current) {
        globalThis.clearTimeout(transitionTimeout.current);
      }
      clearRecordingTimers();
      if (recordingService.isRecording()) {
        recordingService.stopRecording('manual').catch(() => {
          /* noop */
        });
      }
    };
  }, [locale, maxAlternatives, wakeWord, threshold, clearRecordingTimers, updateState]);

  // Start listening for wake word
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      console.error('[useWakeWord] Voice recognition not available');
      return false;
    }

    // Reset state
    isRecordingMode.current = false;
    setPartialTranscript('');
    setFinalTranscript('');
    setLastError(null);
    setDebugInfo((prev) => ({ ...prev, consecutiveErrors: 0 }));
    ignoreResultsRef.current = false;

    if (transitionTimeout.current) {
      globalThis.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
    clearRecordingTimers();

    if (audioService.current.isRecording()) {
      await audioService.current.stopRecording('manual');
    }
    setIsAudioRecording(false);

    updateState('initializing');

    const success = await voiceService.current.start({
      onResults: handleResults,
      onPartialResults: handlePartialResults,
      onError: handleError,
      onStateChange: handleServiceStateChange,
      onWakeWordDetected: handleWakeWordDetected,
    });

    if (success) {
      updateState('listening');
    } else {
      updateState('error');
    }

    return success;
  }, [
    isAvailable,
    handleResults,
    handlePartialResults,
    handleError,
    handleServiceStateChange,
    handleWakeWordDetected,
    updateState,
    clearRecordingTimers,
  ]);

  // Stop listening
  const stop = useCallback(async () => {
    if (transitionTimeout.current) {
      globalThis.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }

    clearRecordingTimers();
    if (audioService.current.isRecording()) {
      await stopAudioRecording('manual');
    }
    isRecordingMode.current = false;
    await voiceService.current.stop();
    updateState('idle');
  }, [clearRecordingTimers, stopAudioRecording, updateState]);

  // Reset to initial state
  const reset = useCallback(() => {
    isRecordingMode.current = false;
    setPartialTranscript('');
    setFinalTranscript('');
    setLastWakeWordMatch(null);
    setLastError(null);
    setDebugInfo({
      consecutiveErrors: 0,
      totalDetections: 0,
      lastDetectionTime: null,
    });
  }, []);

  return {
    // Control methods
    startListening,
    stop,
    reset,

    // State
    state,
    isListening: state === 'listening' || state === 'detected',
    isRecording: state === 'recording' || state === 'processing',
    isAvailable,
    isAudioRecording,

    // Results
    partialTranscript,
    finalTranscript,
    lastWakeWordMatch,
    lastError,
    recording: currentRecording,
    recordings,

    // Debugging
    debugInfo,

    // Voice service instance for advanced features
    voiceService: voiceService.current,
  };
}
