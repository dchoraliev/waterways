import {
  addWakeWordDetectedListener,
  addWakeWordErrorListener,
  addWakeWordStatusListener,
  isListening as nativeIsListening,
  startListening as nativeStartListening,
  stopListening as nativeStopListening,
  type StartListeningOptions,
  type WakeWordDetectedEvent,
  type WakeWordErrorEvent,
  type WakeWordStatusEvent,
} from 'expo-wake-word';
import type { EventSubscription } from 'expo-modules-core';

export interface NativeWakeWordCallbacks {
  onWakeWordDetected?: (event: WakeWordDetectedEvent) => void;
  onError?: (event: WakeWordErrorEvent) => void;
  onStatus?: (event: WakeWordStatusEvent) => void;
}

class NativeWakeWordService {
  private static instance: NativeWakeWordService | null = null;

  private detectedSubscription: EventSubscription | null = null;
  private errorSubscription: EventSubscription | null = null;
  private statusSubscription: EventSubscription | null = null;

  private constructor() {}

  public static getInstance(): NativeWakeWordService {
    if (!NativeWakeWordService.instance) {
      NativeWakeWordService.instance = new NativeWakeWordService();
    }
    return NativeWakeWordService.instance;
  }

  public initialize(): boolean {
    try {
      nativeIsListening();
      return true;
    } catch {
      return false;
    }
  }

  public async start(
    callbacks?: NativeWakeWordCallbacks,
    options?: StartListeningOptions
  ): Promise<boolean> {
    this.removeListeners();

    if (callbacks?.onWakeWordDetected) {
      this.detectedSubscription = addWakeWordDetectedListener(callbacks.onWakeWordDetected);
    }

    if (callbacks?.onError) {
      this.errorSubscription = addWakeWordErrorListener(callbacks.onError);
    }

    if (callbacks?.onStatus) {
      this.statusSubscription = addWakeWordStatusListener(callbacks.onStatus);
    }

    return nativeStartListening(options);
  }

  public async stop(): Promise<void> {
    this.removeListeners();
    await nativeStopListening();
  }

  public isListening(): boolean {
    try {
      return nativeIsListening();
    } catch {
      return false;
    }
  }

  private removeListeners(): void {
    this.detectedSubscription?.remove();
    this.detectedSubscription = null;

    this.errorSubscription?.remove();
    this.errorSubscription = null;

    this.statusSubscription?.remove();
    this.statusSubscription = null;
  }
}

export default NativeWakeWordService;
