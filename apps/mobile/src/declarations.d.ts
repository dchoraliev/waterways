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
