import { requireNativeModule, type EventSubscription } from 'expo-modules-core';

export type WakeWordDetectedEvent = {
  label: string;
  confidence: number;
  inferenceMs: number;
  timestamp: number;
};

export type WakeWordStatusEvent = {
  status: string;
  message?: string;
};

export type WakeWordErrorEvent = {
  code: string;
  message: string;
};

export type StartListeningOptions = {
  wakeWordLabel?: string;
  threshold?: number;
  sampleRate?: number;
  windowSize?: number;
  hopSize?: number;
  cooldownMs?: number;
};

type NativeWakeWordModule = {
  startListening(options?: StartListeningOptions): Promise<boolean>;
  stopListening(): Promise<void>;
  isListening(): boolean;
};

type WakeWordEmitterModule = NativeWakeWordModule & {
  addListener(
    eventName: 'onWakeWordDetected',
    listener: (event: WakeWordDetectedEvent) => void
  ): EventSubscription;
  addListener(
    eventName: 'onWakeWordStatus',
    listener: (event: WakeWordStatusEvent) => void
  ): EventSubscription;
  addListener(
    eventName: 'onWakeWordError',
    listener: (event: WakeWordErrorEvent) => void
  ): EventSubscription;
};

const nativeModule = requireNativeModule<WakeWordEmitterModule>('WaterwaysWakeWord');

export function startListening(options?: StartListeningOptions): Promise<boolean> {
  return nativeModule.startListening(options);
}

export function stopListening(): Promise<void> {
  return nativeModule.stopListening();
}

export function isListening(): boolean {
  return nativeModule.isListening();
}

export function addWakeWordDetectedListener(
  listener: (event: WakeWordDetectedEvent) => void
): EventSubscription {
  return nativeModule.addListener('onWakeWordDetected', listener);
}

export function addWakeWordStatusListener(
  listener: (event: WakeWordStatusEvent) => void
): EventSubscription {
  return nativeModule.addListener('onWakeWordStatus', listener);
}

export function addWakeWordErrorListener(
  listener: (event: WakeWordErrorEvent) => void
): EventSubscription {
  return nativeModule.addListener('onWakeWordError', listener);
}
