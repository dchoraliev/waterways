import { transcribeTripAudio } from '@waterways/mobile/src/services/TranscriptionService';
import * as dbModule from '@waterways/mobile/src/database/db';
import * as obsManager from '@waterways/mobile/src/database/ObservationManager';
import type { UntranscribedAudioRow } from '@waterways/mobile/src/services/TranscriptionService';
import { supabase } from '@waterways/shared/src/supabase/client';

// ------------- Mocks -------------

// Mock getDatabase() to return a fake db with getAllAsync
jest.mock('@waterways/mobile/src/database/db');

// Mock ObservationManager.updateObservationById
jest.mock('@waterways/mobile/src/database/ObservationManager');

// Mock Supabase functions.invoke
jest.mock('@waterways/shared/src/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock expo-file-system/legacy so we don't need the real native module in Jest
jest.mock(
  'expo-file-system/legacy',
  () => ({
    readAsStringAsync: jest.fn(),
  }),
  { virtual: true }
);

// Type-safe access to the mocked things
const mockedGetDatabase = dbModule.getDatabase as unknown as jest.Mock<Promise<FakeDb>, []>;
const mockedUpdateObservationById = obsManager.updateObservationById as jest.MockedFunction<
  typeof obsManager.updateObservationById
>;

type FakeDb = {
  getAllAsync: jest.Mock<Promise<UntranscribedAudioRow[]>, [string, unknown[]]>;
};

type InvokeResult = {
  data?: { text?: string };
  error?: { message: string } | null;
};

type InvokeArgs = [string, { body: { audioBase64: string; filename: string; mimeType: string } }];

const mockedInvoke = supabase.functions.invoke as jest.Mock<Promise<InvokeResult>, InvokeArgs>;

// Need to import AFTER jest.mock for expo-file-system/legacy
import * as LegacyFS from 'expo-file-system/legacy';

const mockedReadAsStringAsync = LegacyFS.readAsStringAsync as jest.MockedFunction<
  typeof LegacyFS.readAsStringAsync
>;

// ------------- Helpers -------------

function makeFakeDb(rows: UntranscribedAudioRow[]): FakeDb {
  return {
    getAllAsync: jest.fn<Promise<UntranscribedAudioRow[]>, [string, unknown[]]>(() =>
      Promise.resolve(rows)
    ),
  };
}

// ------------- Tests -------------

describe('TranscriptionService.transcribeTripAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when there are no untranscribed audio rows', async () => {
    mockedGetDatabase.mockResolvedValue(makeFakeDb([]));

    await transcribeTripAudio('trip-empty');

    expect(mockedInvoke).not.toHaveBeenCalled();
    expect(mockedUpdateObservationById).not.toHaveBeenCalled();
  });

  it('calls Supabase and updates observation when transcription succeeds', async () => {
    const tripId = 'trip-123';
    const observationId = 'obs-1';
    const localPath = '/path/to/audio.m4a';

    const mockRows: UntranscribedAudioRow[] = [
      { observation_id: observationId, local_file_path: localPath },
    ];

    mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));

    mockedReadAsStringAsync.mockResolvedValue('BASE64_AUDIO');

    mockedInvoke.mockResolvedValue({
      data: { text: 'this is the transcript' },
      error: null,
    });

    await transcribeTripAudio(tripId);

    // Ensure we read from the correct path as base64
    expect(mockedReadAsStringAsync).toHaveBeenCalledWith(localPath, {
      encoding: 'base64',
    });

    // Ensure Supabase edge function was called correctly
    expect(mockedInvoke).toHaveBeenCalledTimes(1);
    expect(mockedInvoke).toHaveBeenCalledWith('transcribe-audio', {
      body: {
        audioBase64: 'BASE64_AUDIO',
        filename: 'audio.m4a', // derived from local_path
        mimeType: 'audio/m4a', // from guessMimeType(...)
      },
    });

    // Ensure observation is updated with transcript and audio_transcribed: true
    expect(mockedUpdateObservationById).toHaveBeenCalledTimes(1);
    expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
      observation: 'this is the transcript',
      audio_transcribed: true,
    });
  });

  it('does not update observation if Supabase returns an error', async () => {
    const tripId = 'trip-err';
    const observationId = 'obs-err';
    const localPath = '/path/to/error.m4a';

    const mockRows: UntranscribedAudioRow[] = [
      { observation_id: observationId, local_file_path: localPath },
    ];

    mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));

    mockedReadAsStringAsync.mockResolvedValue('BASE64_BAD');

    mockedInvoke.mockResolvedValue({
      data: undefined,
      error: { message: 'whisper failed' },
    });

    await transcribeTripAudio(tripId);

    expect(mockedInvoke).toHaveBeenCalledTimes(1);

    // Because error is present, we should NOT update the observation
    expect(mockedUpdateObservationById).not.toHaveBeenCalled();
  });

  it('skips a row if local_file_path is missing', async () => {
    const tripId = 'trip-missing-file';

    const mockRows: UntranscribedAudioRow[] = [
      {
        observation_id: 'obs-no-file',
        local_file_path: null,
      },
    ];

    mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));

    await transcribeTripAudio(tripId);

    expect(mockedReadAsStringAsync).not.toHaveBeenCalled();
    expect(mockedInvoke).not.toHaveBeenCalled();
    expect(mockedUpdateObservationById).not.toHaveBeenCalled();
  });

  // ═══════════════════════════════════════════
  // WHISPER HALLUCINATION FILTERING
  // ═══════════════════════════════════════════

  describe('Whisper Hallucination Filtering', () => {
    it('should filter out "Thanks for watching!" hallucination', async () => {
      const tripId = 'trip-hallucination';
      const observationId = 'obs-hallucination';
      const localPath = '/path/to/silence.m4a';

      const mockRows: UntranscribedAudioRow[] = [
        { observation_id: observationId, local_file_path: localPath },
      ];

      mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));
      mockedReadAsStringAsync.mockResolvedValue('BASE64_SILENCE');

      // Whisper returns common hallucination
      mockedInvoke.mockResolvedValue({
        data: { text: 'Thanks for watching!' },
        error: null,
      });

      await transcribeTripAudio(tripId);

      // Should mark as transcribed but with "No speech detected" instead of hallucination
      expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
        observation: 'No speech detected',
        audio_transcribed: true,
      });
    });

    it('should filter out "Thank you for watching!" variant', async () => {
      const tripId = 'trip-variant';
      const observationId = 'obs-variant';
      const localPath = '/path/to/empty.m4a';

      const mockRows: UntranscribedAudioRow[] = [
        { observation_id: observationId, local_file_path: localPath },
      ];

      mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));
      mockedReadAsStringAsync.mockResolvedValue('BASE64_EMPTY');

      // Whisper returns variant hallucination
      mockedInvoke.mockResolvedValue({
        data: { text: 'Thank you for watching!' },
        error: null,
      });

      await transcribeTripAudio(tripId);

      expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
        observation: 'No speech detected',
        audio_transcribed: true,
      });
    });

    it('should NOT filter out valid transcription that contains "thanks"', async () => {
      const tripId = 'trip-valid';
      const observationId = 'obs-valid';
      const localPath = '/path/to/speech.m4a';

      const mockRows: UntranscribedAudioRow[] = [
        { observation_id: observationId, local_file_path: localPath },
      ];

      mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));
      mockedReadAsStringAsync.mockResolvedValue('BASE64_SPEECH');

      // Valid transcription that happens to contain "thanks"
      mockedInvoke.mockResolvedValue({
        data: { text: 'I saw a bridge, thanks to the new infrastructure project' },
        error: null,
      });

      await transcribeTripAudio(tripId);

      // Should keep the valid transcription
      expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
        observation: 'I saw a bridge, thanks to the new infrastructure project',
        audio_transcribed: true,
      });
    });

    it('should filter out empty/whitespace-only transcriptions', async () => {
      const tripId = 'trip-empty';
      const observationId = 'obs-empty';
      const localPath = '/path/to/blank.m4a';

      const mockRows: UntranscribedAudioRow[] = [
        { observation_id: observationId, local_file_path: localPath },
      ];

      mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));
      mockedReadAsStringAsync.mockResolvedValue('BASE64_BLANK');

      // Whisper returns empty string
      mockedInvoke.mockResolvedValue({
        data: { text: '   ' },
        error: null,
      });

      await transcribeTripAudio(tripId);

      expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
        observation: 'No speech detected',
        audio_transcribed: true,
      });
    });

    it('should handle case-insensitive hallucination detection', async () => {
      const tripId = 'trip-case';
      const observationId = 'obs-case';
      const localPath = '/path/to/noise.m4a';

      const mockRows: UntranscribedAudioRow[] = [
        { observation_id: observationId, local_file_path: localPath },
      ];

      mockedGetDatabase.mockResolvedValue(makeFakeDb(mockRows));
      mockedReadAsStringAsync.mockResolvedValue('BASE64_NOISE');

      // Whisper returns mixed case hallucination
      mockedInvoke.mockResolvedValue({
        data: { text: 'THANKS FOR WATCHING!' },
        error: null,
      });

      await transcribeTripAudio(tripId);

      expect(mockedUpdateObservationById).toHaveBeenCalledWith(observationId, {
        observation: 'No speech detected',
        audio_transcribed: true,
      });
    });
  });
});
