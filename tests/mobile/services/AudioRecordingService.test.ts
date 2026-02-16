jest.mock('expo-audio', () => ({
  AudioModule: {
    startRecordingAsync: jest.fn(),
    stopRecordingAsync: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  PermissionsAndroid: {
    PERMISSIONS: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
    request: jest.fn(),
  },
}));

import AudioRecordingService from '../../../apps/mobile/src/services/AudioRecordingService';
import { AudioModule } from 'expo-audio';
import { PermissionsAndroid } from 'react-native';

describe('AudioRecordingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AudioRecordingService as unknown as { instance: unknown }).instance = null;
  });

  it('starts recording when microphone permission is granted', async () => {
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
    (AudioModule.startRecordingAsync as jest.Mock).mockResolvedValue({});

    const service = AudioRecordingService.getInstance();
    await service.startRecording();

    expect(PermissionsAndroid.request).toHaveBeenCalledTimes(1);
    expect(AudioModule.startRecordingAsync).toHaveBeenCalledTimes(1);
    expect(service.isRecording()).toBe(true);
  });

  it('throws when microphone permission is denied', async () => {
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue('denied');

    const service = AudioRecordingService.getInstance();

    await expect(service.startRecording()).rejects.toThrow(
      'Microphone permission is required for audio recording'
    );
    expect(AudioModule.startRecordingAsync).not.toHaveBeenCalled();
    expect(service.isRecording()).toBe(false);
  });

  it('returns null if stopRecording is called while not recording', async () => {
    const service = AudioRecordingService.getInstance();

    const result = await service.stopRecording('manual');

    expect(result).toBeNull();
    expect(AudioModule.stopRecordingAsync).not.toHaveBeenCalled();
  });

  it('stops recording and returns metadata', async () => {
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue('granted');
    (AudioModule.startRecordingAsync as jest.Mock).mockResolvedValue({});
    (AudioModule.stopRecordingAsync as jest.Mock).mockResolvedValue({ uri: 'file:///test.m4a' });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy
      .mockReturnValueOnce(1000) // startRecording -> startedAt
      .mockReturnValueOnce(2500); // stopRecording -> endedAt

    const service = AudioRecordingService.getInstance();
    await service.startRecording();
    const result = await service.stopRecording('timeout');

    expect(result).toEqual({
      uri: 'file:///test.m4a',
      durationMillis: 1500,
      reason: 'timeout',
      startedAt: 1000,
      endedAt: 2500,
    });
    expect(service.isRecording()).toBe(false);

    nowSpy.mockRestore();
  });
});
