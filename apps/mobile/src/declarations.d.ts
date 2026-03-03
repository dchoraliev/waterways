declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

declare module 'expo-audio' {
  export type AudioPermissionStatus = 'undetermined' | 'granted' | 'denied';
  export interface AudioPermissionResponse {
    status: AudioPermissionStatus;
    granted: boolean;
  }

  export interface ExpoAudioRecorder {
    uri: string | null;
    prepareToRecordAsync: () => Promise<void>;
    record: () => Promise<void>;
    stop: () => Promise<void>;
  }

  export const AudioModule: {
    startRecordingAsync: (options?: Record<string, unknown>) => Promise<unknown>;
    stopRecordingAsync: () => Promise<{ uri: string }>;
  };

  export const RecordingPresets: Record<string, unknown>;
  export function getRecordingPermissionsAsync(): Promise<AudioPermissionResponse>;
  export function requestRecordingPermissionsAsync(): Promise<AudioPermissionResponse>;
  export function setAudioModeAsync(mode: Record<string, unknown>): Promise<void>;
  export function useAudioRecorder(preset?: unknown): ExpoAudioRecorder;
  export function useAudioRecorderState(recorder: unknown): { isRecording?: boolean } | null;
}

// Metro exposes require.context at bundle-time.
// Augment NodeJS.Require (the actual type of the global `require` in @types/node)
// so `tsc` passes in CI where expo-env.d.ts is not committed to git.
// Return type matches expo-router's RequireContext interface (keys, call sig, resolve, id).
declare namespace NodeJS {
  interface Require {
    context(
      path: string,
      recursive?: boolean,
      regExp?: RegExp
    ): {
      keys(): string[];
      (id: string): string;
      <T>(id: string): T;
      resolve(id: string): string;
      id: string;
    };
  }
}
