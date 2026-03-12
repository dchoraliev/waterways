import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
} from '@react-native-voice/voice';

export enum SpeechErrorCode {
  NETWORK_TIMEOUT = 1,
  NETWORK = 2,
  AUDIO = 3,
  SERVER = 4,
  CLIENT = 5,
  SPEECH_TIMEOUT = 6,
  NO_MATCH = 7,
  RECOGNIZER_BUSY = 8,
  INSUFFICIENT_PERMISSIONS = 9,
}

export interface VoiceRecognitionConfig {
  locale?: string;
  continuous?: boolean;
  maxAlternatives?: number;
  returnPartialResults?: boolean;
  wakeWord?: string;
  wakeWordThreshold?: number;
}

export interface RecognitionResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
  timestamp: number;
}

export interface RecognitionError {
  code?: string | number;
  message?: string;
  isRecoverable: boolean;
  timestamp: number;
}

export type RecognitionState =
  | 'idle'
  | 'initializing'
  | 'listening'
  | 'recognizing'
  | 'stopping'
  | 'error';

export interface VoiceEventCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResults?: (results: RecognitionResult[]) => void;
  onPartialResults?: (results: RecognitionResult[]) => void;
  onError?: (error: RecognitionError) => void;
  onStateChange?: (state: RecognitionState) => void;
  onWakeWordDetected?: () => void;
}

class VoiceRecognitionService {
  private static instance: VoiceRecognitionService | null = null;

  private state: RecognitionState = 'idle';
  private callbacks: VoiceEventCallbacks = {};
  private config: VoiceRecognitionConfig = {
    locale: 'en-US',
    continuous: false,
    maxAlternatives: 5,
    returnPartialResults: true,
  };

  private isInitialized = false;
  private shouldContinue = false;
  private wakeWordDetected = false;

  // Increased from 50ms — iOS fires multiple result events for the same
  // utterance in quick succession; 300ms prevents duplicate wake word triggers
  private lastEventAt = 0;
  private readonly EVENT_DEBOUNCE_MS = 300;

  // Cooldown after wake word fires — prevents the same utterance being
  // detected 2-3 times before the restart cycle completes
  private wakeWordCooldownUntil = 0;
  private readonly WAKE_WORD_COOLDOWN_MS = 2000;

  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 3;
  private restartTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private readonly RESTART_DELAY_BASE_MS = 300;

  private constructor() {}

  public static getInstance(): VoiceRecognitionService {
    if (!VoiceRecognitionService.instance) {
      VoiceRecognitionService.instance = new VoiceRecognitionService();
    }
    return VoiceRecognitionService.instance;
  }

  public async initialize(config?: Partial<VoiceRecognitionConfig>): Promise<boolean> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      const available = await Voice.isAvailable();
      if (!available) {
        this.setState('error');
        return false;
      }

      Voice.removeAllListeners();
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;
      Voice.onSpeechError = this.onSpeechError;

      this.isInitialized = true;
      this.setState('idle');
      return true;
    } catch (error) {
      console.error('[VoiceService] initialize failed:', error);
      this.setState('error');
      return false;
    }
  }

  public async start(callbacks?: VoiceEventCallbacks): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    if (this.state === 'listening' || this.state === 'recognizing') {
      return true;
    }

    try {
      this.shouldContinue = !!this.config.continuous;
      this.wakeWordDetected = false;
      this.wakeWordCooldownUntil = 0;
      this.clearRestartTimeout();
      this.setState('initializing');

      await Voice.start(this.config.locale || 'en-US');
      this.setState('listening');
      return true;
    } catch (error) {
      console.error('[VoiceService] start failed:', error);
      this.handleError({
        message: error instanceof Error ? error.message : 'Failed to start',
        isRecoverable: true,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  public async stop(): Promise<void> {
    if (this.state === 'idle' || this.state === 'stopping') {
      return;
    }

    this.shouldContinue = false;
    this.wakeWordDetected = false;
    this.wakeWordCooldownUntil = 0;
    this.clearRestartTimeout();
    this.setState('stopping');

    try {
      await Voice.stop();
    } catch (error) {
      console.error('[VoiceService] stop failed:', error);
    } finally {
      this.setState('idle');
    }
  }

  public async cancel(): Promise<void> {
    this.shouldContinue = false;
    this.wakeWordDetected = false;
    this.wakeWordCooldownUntil = 0;
    this.clearRestartTimeout();

    try {
      await Voice.cancel();
    } catch (error) {
      console.error('[VoiceService] cancel failed:', error);
    } finally {
      this.setState('idle');
    }
  }

  public async destroy(): Promise<void> {
    this.shouldContinue = false;
    this.wakeWordDetected = false;
    this.wakeWordCooldownUntil = 0;
    this.clearRestartTimeout();

    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (error) {
      console.error('[VoiceService] destroy failed:', error);
    } finally {
      this.isInitialized = false;
      this.callbacks = {};
      this.consecutiveErrors = 0;
      this.setState('idle');
    }
  }

  public getState(): RecognitionState {
    return this.state;
  }

  public isListening(): boolean {
    return this.state === 'listening' || this.state === 'recognizing';
  }

  private onSpeechStart = (_event: SpeechStartEvent): void => {
    if (this.shouldDebounce()) return;
    if (!this.isListening()) return;
    this.setState('recognizing');
    this.callbacks.onStart?.();
  };

  private onSpeechEnd = (_event: SpeechEndEvent): void => {
    if (this.shouldDebounce()) return;
    if (!this.isListening()) return;
    this.callbacks.onEnd?.();
    if (this.shouldContinue) {
      this.scheduleRestart();
    } else {
      this.setState('idle');
    }
  };

  private onSpeechResults = (event: SpeechResultsEvent): void => {
    if (this.shouldDebounce()) return;
    if (!this.isListening()) return;

    this.consecutiveErrors = 0;

    const value = event.value ?? [];
    if (!value.length) return;

    const now = Date.now();

    // --- Wake word gating ---
    if (this.config.wakeWord) {
      const wakeWord = this.config.wakeWord.toLowerCase().trim();

      if (!this.wakeWordDetected) {
        const heard = value.some((t) => t.toLowerCase().includes(wakeWord));

        if (heard) {
          // Cooldown check — prevents duplicate triggers from multiple iOS
          // result events fired for the same utterance
          if (now < this.wakeWordCooldownUntil) {
            console.log('[VoiceService] Wake word suppressed by cooldown');
            this.scheduleRestart();
            return;
          }

          this.wakeWordCooldownUntil = now + this.WAKE_WORD_COOLDOWN_MS;
          this.callbacks.onWakeWordDetected?.();
          this.scheduleRestart();
        } else {
          if (this.shouldContinue) {
            this.scheduleRestart();
          } else {
            this.setState('idle');
          }
        }
        return; // never fire onResults in wake word mode
      }

      // Wake word already detected — this is the command utterance
      this.wakeWordDetected = false;
    }
    // --- End wake word gating ---

    const results: RecognitionResult[] = value
      .slice(0, this.config.maxAlternatives ?? value.length)
      .map((text, index) => ({
        text,
        confidence: this.estimateConfidence(text, index),
        isFinal: true,
        timestamp: now,
      }));

    this.callbacks.onResults?.(results);

    if (this.shouldContinue) {
      this.scheduleRestart();
    } else {
      this.setState('idle');
    }
  };

  private onSpeechPartialResults = (event: SpeechResultsEvent): void => {
    if (!this.config.returnPartialResults) return;
    if (this.shouldDebounce()) return;
    if (!this.isListening()) return;

    // Don't surface partial results until wake word has been confirmed
    if (this.config.wakeWord && !this.wakeWordDetected) return;

    const value = event.value ?? [];
    if (value.length) {
      const now = Date.now();
      const results: RecognitionResult[] = value
        .slice(0, this.config.maxAlternatives ?? value.length)
        .map((text, index) => ({
          text,
          confidence: this.estimateConfidence(text, index),
          isFinal: false,
          timestamp: now,
        }));
      this.callbacks.onPartialResults?.(results);
    }
  };

  private onSpeechError = (event: SpeechErrorEvent): void => {
    const code = event.error?.code;
    const message = event.error?.message || 'Unknown error';
    const isRecoverable = this.isRecoverableError(code, message);
    const recognitionError: RecognitionError = {
      code,
      message,
      isRecoverable,
      timestamp: Date.now(),
    };

    if (!isRecoverable) {
      this.consecutiveErrors++;
      this.callbacks.onError?.(recognitionError);
    }

    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      this.shouldContinue = false;
      this.setState('error');
      return;
    }

    if (this.shouldContinue && isRecoverable && this.state !== 'stopping') {
      this.scheduleRestart(true);
      return;
    }

    this.setState(isRecoverable ? 'idle' : 'error');
  };

  private isRecoverableError(errorCode?: string | number, message?: string): boolean {
    if (errorCode === undefined || errorCode === null) {
      return true;
    }

    // FIXED: Handle iOS "recognition_fail" with "1110/No speech detected" in message
    // Check message first since iOS sends error code as string "recognition_fail"
    if (message) {
      if (message.includes('1110') || message.toLowerCase().includes('no speech detected')) {
        return true;
      }
    }

    // Try to parse error code as number
    const code = typeof errorCode === 'string' ? parseInt(errorCode, 10) : errorCode;

    // If parsing failed (NaN), it's likely a string code like "recognition_fail"
    if (typeof code === 'number' && isNaN(code)) {
      // Treat unknown string codes as recoverable by default
      return true;
    }

    return [
      SpeechErrorCode.CLIENT,
      SpeechErrorCode.NO_MATCH,
      SpeechErrorCode.SPEECH_TIMEOUT,
      SpeechErrorCode.RECOGNIZER_BUSY,
      11,
      1110, // iOS "No speech detected" - normal when silent
    ].includes(code);
  }

  private scheduleRestart(isErrorRecovery = false): void {
    if (!this.shouldContinue) return;
    this.clearRestartTimeout();

    const delay = isErrorRecovery
      ? this.RESTART_DELAY_BASE_MS * Math.pow(2, Math.min(this.consecutiveErrors, 3))
      : this.RESTART_DELAY_BASE_MS;

    this.restartTimeout = globalThis.setTimeout(async () => {
      try {
        await Voice.start(this.config.locale || 'en-US');
        this.setState('listening');
      } catch (error) {
        console.error('[VoiceService] restart failed:', error);
        this.handleError({
          message: 'Failed to restart',
          isRecoverable: true,
          timestamp: Date.now(),
        });
      }
    }, delay);
  }

  private clearRestartTimeout(): void {
    if (!this.restartTimeout) return;
    globalThis.clearTimeout(this.restartTimeout);
    this.restartTimeout = null;
  }

  private handleError(error: RecognitionError): void {
    this.setState('error');
    this.callbacks.onError?.(error);
  }

  private setState(newState: RecognitionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  private shouldDebounce(): boolean {
    const now = Date.now();
    if (now - this.lastEventAt < this.EVENT_DEBOUNCE_MS) {
      return true;
    }
    this.lastEventAt = now;
    return false;
  }

  private estimateConfidence(text: string, index: number): number {
    const base = 0.95 - index * 0.1;
    const lengthBonus = Math.min(text.length / 100, 0.05);
    return Math.max(0.5, Math.min(1, base + lengthBonus));
  }
}

export default VoiceRecognitionService;
