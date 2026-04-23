import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import AudioRecordingService, {
  RecordingResult,
  RecordingStopReason,
} from '../services/AudioRecordingService';
import { WakeWordMatch } from '../utils/stringMatching';
import { hasNativeModules } from '../utils/platformDetection';

type SpeechResult = {
  transcript: string;
  confidence: number;
};

type SpeechResultEvent = {
  isFinal: boolean;
  results: SpeechResult[];
};

type SpeechErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'busy'
  | 'client'
  | 'interrupted'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'speech-timeout'
  | 'unknown';

type SpeechErrorEvent = {
  error: SpeechErrorCode;
  message: string;
  code?: number;
};

type SpeechPermission = {
  granted: boolean;
};

type SpeechSubscription = {
  remove: () => void;
};

type SpeechModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  addListener: (
    eventName: 'start' | 'result' | 'error' | 'end',
    listener: (event: unknown) => void
  ) => SpeechSubscription;
  requestPermissionsAsync: () => Promise<SpeechPermission>;
  isRecognitionAvailable: () => boolean;
};

async function resolveSpeechModule(): Promise<SpeechModule | null> {
  try {
    const speechPackage = (await import('expo-speech-recognition')) as {
      ExpoSpeechRecognitionModule?: SpeechModule;
    };
    return speechPackage.ExpoSpeechRecognitionModule ?? null;
  } catch (error) {
    console.warn('[useWakeWord] expo-speech-recognition unavailable:', error);
    return null;
  }
}

export interface RecognitionError {
  code?: string | number;
  message?: string;
  isRecoverable: boolean;
  timestamp: number;
}

export type WakeWordState =
  | 'idle'
  | 'initializing'
  | 'listening'
  | 'detected'
  | 'recording'
  | 'processing'
  | 'error';

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
  startListening: () => Promise<boolean>;
  stop: () => Promise<void>;
  stopAndRestart: () => Promise<boolean>;
  reset: () => void;
  state: WakeWordState;
  isListening: boolean;
  isRecording: boolean;
  isAvailable: boolean;
  isAudioRecording: boolean;
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
  debugInfo: {
    consecutiveErrors: number;
    totalDetections: number;
    lastDetectionTime: number | null;
  };
  voiceService: unknown | null;
}

const EXTERNAL_RECORDING_COOLDOWN_MS = 1200;
const WAKE_WORD_COOLDOWN_MS = 2000;
const RESTART_DELAY_MS = 350;
const STOP_RESTART_DELAY_MS = 250;
const RECOVERABLE_ERRORS = new Set<SpeechErrorCode>([
  'aborted',
  'audio-capture',
  'busy',
  'client',
  'interrupted',
  'no-speech',
  'speech-timeout',
]);

function normalize(input: string): string {
  return input.toLowerCase().trim();
}

function hasWakeWord(text: string, wakeWord: string): boolean {
  return normalize(text).includes(normalize(wakeWord));
}

export function useWakeWord(config: WakeWordConfig): WakeWordControls {
  const {
    wakeWord,
    locale = 'en-US',
    continuous = true,
    maxAlternatives = 5,
    onWakeWordDetected,
    onTranscript,
    onError,
    onStateChange,
    onRecordingComplete,
    recordingDelayMs = 1000,
    recordingDurationMs = 20000,
  } = config;

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
  const [debugInfo, setDebugInfo] = useState({
    consecutiveErrors: 0,
    totalDetections: 0,
    lastDetectionTime: null as number | null,
  });

  const speechModuleRef = useRef<SpeechModule | null>(null);
  const subscriptionsRef = useRef<SpeechSubscription[]>([]);

  const audioService = useRef(AudioRecordingService.getInstance());
  const isRecordingModeRef = useRef(false);
  const ignoreResultsRef = useRef(false);
  const shouldListenRef = useRef(false);
  const wakeWordDetectedRef = useRef(false);
  const wakeWordCooldownUntilRef = useRef(0);

  const onStateChangeRef = useRef(onStateChange);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  const transitionTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const recordingStartTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const recordingStopTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const restartTimeout = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
    if (transitionTimeout.current) {
      globalThis.clearTimeout(transitionTimeout.current);
      transitionTimeout.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (!restartTimeout.current) return;
    globalThis.clearTimeout(restartTimeout.current);
    restartTimeout.current = null;
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
        isRecordingModeRef.current = false;
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
      isRecordingModeRef.current = false;
      updateState('error');
    }
  }, [recordingDurationMs, stopAudioRecording, updateState]);

  const stopNativeRecognition = useCallback(() => {
    const speechModule = speechModuleRef.current;
    if (!speechModule) return;

    try {
      speechModule.stop();
    } catch {
      speechModule.abort();
    }
  }, []);

  const startNativeRecognition = useCallback((): boolean => {
    const speechModule = speechModuleRef.current;
    if (!speechModule) {
      return false;
    }

    try {
      const startOptions = {
        lang: locale,
        interimResults: true,
        continuous: true,
        maxAlternatives,
        iosTaskHint: 'dictation',
      } as Record<string, unknown>;

      if (Platform.OS === 'ios') {
        startOptions.useApplicationAudioSession = false;
      }

      speechModule.start(startOptions);
      return true;
    } catch (error) {
      console.error('[useWakeWord] Failed to start recognition:', error);
      return false;
    }
  }, [locale, maxAlternatives]);

  const scheduleRestart = useCallback(() => {
    if (!shouldListenRef.current) {
      return;
    }

    clearRestartTimer();
    restartTimeout.current = globalThis.setTimeout(() => {
      restartTimeout.current = null;
      if (!shouldListenRef.current) return;
      startNativeRecognition();
    }, RESTART_DELAY_MS);
  }, [clearRestartTimer, startNativeRecognition]);

  const triggerWakeWordFlow = useCallback(
    (match: WakeWordMatch) => {
      setLastWakeWordMatch(match);
      setDebugInfo((prev) => ({
        ...prev,
        totalDetections: prev.totalDetections + 1,
        lastDetectionTime: Date.now(),
      }));

      updateState('detected');
      onWakeWordDetectedRef.current?.(match);
      setPartialTranscript('');
      setFinalTranscript('');
      clearRecordingTimers();

      if (recordingDurationMs <= 0) {
        isRecordingModeRef.current = false;
        ignoreResultsRef.current = true;

        const cooldownMs = Math.max(recordingDelayMs, EXTERNAL_RECORDING_COOLDOWN_MS);
        transitionTimeout.current = globalThis.setTimeout(() => {
          transitionTimeout.current = null;
          ignoreResultsRef.current = false;
          updateState('listening');
        }, cooldownMs);
        return;
      }

      isRecordingModeRef.current = true;
      ignoreResultsRef.current = false;

      transitionTimeout.current = globalThis.setTimeout(() => {
        transitionTimeout.current = null;
        updateState('recording');
      }, recordingDelayMs);

      recordingStartTimeout.current = globalThis.setTimeout(() => {
        recordingStartTimeout.current = null;
        void startAudioRecording();
      }, recordingDelayMs);
    },
    [clearRecordingTimers, recordingDelayMs, recordingDurationMs, startAudioRecording, updateState]
  );

  const handleResultEvent = useCallback(
    (event: SpeechResultEvent) => {
      if (ignoreResultsRef.current) return;
      if (!event.results.length) return;

      const text = event.results[0]?.transcript ?? '';
      if (!text) return;

      if (!wakeWordDetectedRef.current) {
        if (hasWakeWord(text, wakeWord)) {
          const now = Date.now();
          if (now < wakeWordCooldownUntilRef.current) {
            return;
          }

          wakeWordDetectedRef.current = true;
          wakeWordCooldownUntilRef.current = now + WAKE_WORD_COOLDOWN_MS;

          const match: WakeWordMatch = {
            isMatch: true,
            confidence: 1,
            stage: 'full',
          };
          triggerWakeWordFlow(match);
        }
        return;
      }

      if (event.isFinal) {
        wakeWordDetectedRef.current = false;
      }

      if (!isRecordingModeRef.current) {
        return;
      }

      if (event.isFinal) {
        setFinalTranscript(text);
        onTranscriptRef.current?.(text, true);
        if (!continuous) {
          updateState('processing');
          shouldListenRef.current = false;
          stopNativeRecognition();
        }
      } else {
        setPartialTranscript(text);
        onTranscriptRef.current?.(text, false);
      }
    },
    [continuous, stopNativeRecognition, triggerWakeWordFlow, updateState, wakeWord]
  );

  const handleErrorEvent = useCallback(
    (event: SpeechErrorEvent) => {
      const isRecoverable = RECOVERABLE_ERRORS.has(event.error);
      const error: RecognitionError = {
        code: event.error,
        message: event.message,
        isRecoverable,
        timestamp: Date.now(),
      };

      if (isRecoverable) {
        if (isRecordingModeRef.current) {
          isRecordingModeRef.current = false;
          updateState('listening');
        }
        if (shouldListenRef.current) {
          scheduleRestart();
        }
        return;
      }

      setLastError(error);
      setDebugInfo((prev) => ({
        ...prev,
        consecutiveErrors: prev.consecutiveErrors + 1,
      }));
      onErrorRef.current?.(error);
      updateState('error');
    },
    [scheduleRestart, updateState]
  );

  useEffect(() => {
    const speechModule = speechModuleRef.current;
    if (!isAvailable || !speechModule) return;

    subscriptionsRef.current.forEach((subscription) => subscription.remove());
    subscriptionsRef.current = [
      speechModule.addListener('start', () => {
        if (!shouldListenRef.current) return;
        if (isRecordingModeRef.current || ignoreResultsRef.current) return;
        updateState('listening');
      }),
      speechModule.addListener('result', (event) => {
        handleResultEvent(event as SpeechResultEvent);
      }),
      speechModule.addListener('error', (event) => {
        handleErrorEvent(event as SpeechErrorEvent);
      }),
      speechModule.addListener('end', () => {
        if (!shouldListenRef.current) {
          updateState('idle');
          return;
        }
        scheduleRestart();
      }),
    ];

    return () => {
      subscriptionsRef.current.forEach((subscription) => subscription.remove());
      subscriptionsRef.current = [];
    };
  }, [handleErrorEvent, handleResultEvent, isAvailable, scheduleRestart, updateState]);

  useEffect(() => {
    const init = async () => {
      if (!hasNativeModules()) {
        setIsAvailable(false);
        updateState('idle');
        return;
      }

      const speechModule = await resolveSpeechModule();
      speechModuleRef.current = speechModule;

      if (!speechModule || !speechModule.isRecognitionAvailable()) {
        setIsAvailable(false);
        updateState('idle');
        return;
      }

      setIsAvailable(true);
      updateState('idle');
    };

    void init();

    return () => {
      shouldListenRef.current = false;
      clearRecordingTimers();
      clearRestartTimer();
      stopNativeRecognition();
      subscriptionsRef.current.forEach((subscription) => subscription.remove());
      subscriptionsRef.current = [];
      if (audioService.current.isRecording()) {
        audioService.current.stopRecording('manual').catch(() => undefined);
      }
    };
  }, [clearRecordingTimers, clearRestartTimer, stopNativeRecognition, updateState]);

  const startListening = useCallback(async (): Promise<boolean> => {
    const speechModule = speechModuleRef.current;
    if (!isAvailable || !speechModule) {
      return false;
    }

    const permission = await speechModule.requestPermissionsAsync();
    if (!permission.granted) {
      const deniedError: RecognitionError = {
        code: 'not-allowed',
        message: 'Microphone or speech recognition permission denied',
        isRecoverable: false,
        timestamp: Date.now(),
      };
      setLastError(deniedError);
      onErrorRef.current?.(deniedError);
      updateState('error');
      return false;
    }

    clearRecordingTimers();
    clearRestartTimer();

    if (audioService.current.isRecording()) {
      await audioService.current.stopRecording('manual');
    }
    setIsAudioRecording(false);

    isRecordingModeRef.current = false;
    ignoreResultsRef.current = false;
    shouldListenRef.current = true;
    wakeWordDetectedRef.current = false;
    wakeWordCooldownUntilRef.current = 0;

    setPartialTranscript('');
    setFinalTranscript('');
    setLastError(null);
    setDebugInfo((prev) => ({ ...prev, consecutiveErrors: 0 }));
    updateState('initializing');

    const started = startNativeRecognition();
    if (!started) {
      shouldListenRef.current = false;
      updateState('error');
      return false;
    }

    updateState('listening');
    return true;
  }, [clearRecordingTimers, clearRestartTimer, isAvailable, startNativeRecognition, updateState]);

  const stop = useCallback(async () => {
    shouldListenRef.current = false;
    wakeWordDetectedRef.current = false;
    wakeWordCooldownUntilRef.current = 0;
    clearRecordingTimers();
    clearRestartTimer();

    if (audioService.current.isRecording()) {
      await stopAudioRecording('manual');
    }
    isRecordingModeRef.current = false;
    ignoreResultsRef.current = true;

    stopNativeRecognition();
    updateState('idle');
  }, [
    clearRecordingTimers,
    clearRestartTimer,
    stopAudioRecording,
    stopNativeRecognition,
    updateState,
  ]);

  const stopAndRestart = useCallback(async (): Promise<boolean> => {
    await stop();
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, STOP_RESTART_DELAY_MS);
    });
    return startListening();
  }, [startListening, stop]);

  const reset = useCallback(() => {
    isRecordingModeRef.current = false;
    wakeWordDetectedRef.current = false;
    wakeWordCooldownUntilRef.current = 0;
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
    startListening,
    stop,
    stopAndRestart,
    reset,
    state,
    isListening: state === 'listening' || state === 'detected',
    isRecording: state === 'recording' || state === 'processing',
    isAvailable,
    isAudioRecording,
    partialTranscript,
    finalTranscript,
    lastWakeWordMatch,
    lastError,
    recording: currentRecording,
    recordings,
    debugInfo,
    voiceService: null,
  };
}
