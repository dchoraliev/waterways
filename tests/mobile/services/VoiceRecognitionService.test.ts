const mockVoiceModule = {
  isAvailable: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn(),
  destroy: jest.fn(),
  removeAllListeners: jest.fn(),
  onSpeechStart: undefined as undefined | ((event: unknown) => void),
  onSpeechEnd: undefined as undefined | ((event: unknown) => void),
  onSpeechResults: undefined as undefined | ((event: { value?: string[] }) => void),
  onSpeechPartialResults: undefined as undefined | ((event: { value?: string[] }) => void),
  onSpeechError: undefined as
    | undefined
    | ((event: { error?: { code?: number | string; message?: string } }) => void),
};

jest.mock(
  '@react-native-voice/voice',
  () => ({
    __esModule: true,
    ...mockVoiceModule,
    default: mockVoiceModule,
  }),
  { virtual: true }
);

import VoiceRecognitionService from '../../../apps/mobile/src/services/VoiceRecognitionService';

describe('VoiceRecognitionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (VoiceRecognitionService as unknown as { instance: unknown }).instance = null;
    mockVoiceModule.onSpeechStart = undefined;
    mockVoiceModule.onSpeechEnd = undefined;
    mockVoiceModule.onSpeechResults = undefined;
    mockVoiceModule.onSpeechPartialResults = undefined;
    mockVoiceModule.onSpeechError = undefined;
  });

  it('returns false when speech is unavailable', async () => {
    mockVoiceModule.isAvailable.mockResolvedValue(false);

    const service = VoiceRecognitionService.getInstance();
    const initialized = await service.initialize();

    expect(initialized).toBe(false);
    expect(service.getState()).toBe('error');
  });

  it('does not start when not initialized', async () => {
    const service = VoiceRecognitionService.getInstance();

    const started = await service.start();

    expect(started).toBe(false);
    expect(mockVoiceModule.start).not.toHaveBeenCalled();
    expect(service.getState()).toBe('idle');
    expect(service.isListening()).toBe(false);
  });

  it('stays stable when stop is called from idle state', async () => {
    const service = VoiceRecognitionService.getInstance();

    await service.stop();

    expect(mockVoiceModule.stop).not.toHaveBeenCalled();
    expect(service.getState()).toBe('idle');
  });
});
