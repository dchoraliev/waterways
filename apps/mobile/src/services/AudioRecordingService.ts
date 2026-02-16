import { AudioModule } from 'expo-audio';
import { PermissionsAndroid, Platform } from 'react-native';

export type RecordingStopReason = 'manual' | 'timeout';

export interface RecordingResult {
  uri: string;
  durationMillis: number;
  reason: RecordingStopReason;
  startedAt: number;
  endedAt: number;
}

class AudioRecordingService {
  private static instance: AudioRecordingService | null = null;

  private recordingStartedAt = 0;
  private isCurrentlyRecording = false;

  private constructor() {}

  public static getInstance(): AudioRecordingService {
    if (!AudioRecordingService.instance) {
      AudioRecordingService.instance = new AudioRecordingService();
    }
    return AudioRecordingService.instance;
  }

  private async ensurePermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'We need access to your microphone for audio recording.',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Microphone permission is required for audio recording');
      }
    }
  }

  public async startRecording(): Promise<void> {
    await this.ensurePermissions();

    if (this.isCurrentlyRecording) {
      await this.stopRecording('manual');
    }

    try {
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
        },
      };

      await AudioModule.startRecordingAsync(recordingOptions);
      this.isCurrentlyRecording = true;
      this.recordingStartedAt = Date.now();
    } catch (error) {
      console.error('[AudioRecordingService] Failed to start recording:', error);
      throw error;
    }
  }

  public async stopRecording(reason: RecordingStopReason): Promise<RecordingResult | null> {
    if (!this.isCurrentlyRecording) {
      return null;
    }

    try {
      const endedAt = Date.now();
      const result = await AudioModule.stopRecordingAsync();
      const durationMillis = endedAt - this.recordingStartedAt;

      const recordingResult: RecordingResult = {
        uri: result.uri,
        durationMillis,
        reason,
        startedAt: this.recordingStartedAt,
        endedAt,
      };

      this.isCurrentlyRecording = false;
      return recordingResult;
    } catch (error) {
      console.error('[AudioRecordingService] Failed to stop recording:', error);
      this.isCurrentlyRecording = false;
      return null;
    }
  }

  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }
}

export default AudioRecordingService;
