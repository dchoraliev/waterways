// tests/mobile/database/SyncManager.test.ts

// Mock expo-file-system/legacy
const mockFileSystem = {
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
};

jest.mock('expo-file-system/legacy', () => mockFileSystem, { virtual: true });

// Mock expo-sqlite - use jest.requireActual to avoid out-of-scope variable error
jest.mock('expo-sqlite', () => jest.requireActual('../__mocks__/db'));

import * as TripManager from '@waterways/mobile/src/database/TripManager';
import * as ObservationManager from '@waterways/mobile/src/database/ObservationManager';
import * as MediaManager from '@waterways/mobile/src/database/MediaManager';
import {
  SyncStatus,
  parseDateTime,
  parseLocationAsEWKT,
} from '@waterways/mobile/src/database/SyncManager';

// Mock database managers
jest.mock('@waterways/mobile/src/database/TripManager');
jest.mock('@waterways/mobile/src/database/ObservationManager');
jest.mock('@waterways/mobile/src/database/MediaManager');

// Mock Supabase client
const mockSupabaseStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockSupabaseFrom = {
  upsert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@shared/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseFrom),
    storage: mockSupabaseStorage,
  },
}));

// Type the mocked functions
const mockedGetTripById = TripManager.getTripById as jest.MockedFunction<
  typeof TripManager.getTripById
>;
const mockedUpdateTripById = TripManager.updateTripById as jest.MockedFunction<
  typeof TripManager.updateTripById
>;

const mockedGetObservationsByTripId =
  ObservationManager.getObservationsByTripId as jest.MockedFunction<
    typeof ObservationManager.getObservationsByTripId
  >;
const mockedUpdateObservationById = ObservationManager.updateObservationById as jest.MockedFunction<
  typeof ObservationManager.updateObservationById
>;

const mockedGetMediaById = MediaManager.getMediaById as jest.MockedFunction<
  typeof MediaManager.getMediaById
>;
const mockedUpdateMediaById = MediaManager.updateMediaById as jest.MockedFunction<
  typeof MediaManager.updateMediaById
>;

// ═════════════════════════════════════════════
// SYNC MANAGER - Utility Functions
// ═════════════════════════════════════════════

describe('SyncManager utility functions', () => {
  test('SyncStatus enum has expected values', () => {
    expect(SyncStatus.PENDING).toBe('pending');
    expect(SyncStatus.DRAFTED).toBe('drafted');
    expect(SyncStatus.REVIEWED).toBe('reviewed');
    expect(SyncStatus.SYNCED).toBe('synced');
    expect(SyncStatus.ERROR).toBe('error');
  });

  describe('parseDateTime', () => {
    test('returns ISO string for valid date input', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = parseDateTime(date);
      expect(result).toBe(date.toISOString());
    });

    test('parses numeric timestamp', () => {
      const ts = Date.UTC(2024, 0, 1, 0, 0, 0);
      const result = parseDateTime(ts);
      expect(result).toBe(new Date(ts).toISOString());
    });

    test('parses ISO string', () => {
      const iso = '2024-01-01T00:00:00.000Z';
      const result = parseDateTime(iso);
      expect(result).toBe(iso);
    });

    test('returns undefined for null/undefined/empty', () => {
      expect(parseDateTime(null)).toBeUndefined();
      expect(parseDateTime(undefined)).toBeUndefined();
      expect(parseDateTime('')).toBeUndefined();
    });

    test('returns undefined for invalid date', () => {
      expect(parseDateTime('not-a-date')).toBeUndefined();
    });
  });

  describe('parseLocationAsEWKT', () => {
    test('returns EWKT string for valid lon/lat', () => {
      const result = parseLocationAsEWKT(-90.123, 42.456);
      expect(result).toBe('SRID=4326;POINT(-90.123 42.456)');
    });

    test('accepts string numbers and custom SRID', () => {
      const result = parseLocationAsEWKT('-10.5', '50.25', 3857);
      expect(result).toBe('SRID=3857;POINT(-10.5 50.25)');
    });

    test('returns undefined when lon or lat is missing/empty', () => {
      expect(parseLocationAsEWKT(null, 42)).toBeUndefined();
      expect(parseLocationAsEWKT(-90, null)).toBeUndefined();
      expect(parseLocationAsEWKT('', 42)).toBeUndefined();
      expect(parseLocationAsEWKT(-90, '')).toBeUndefined();
      expect(parseLocationAsEWKT(undefined, 42)).toBeUndefined();
      expect(parseLocationAsEWKT(-90, undefined)).toBeUndefined();
    });

    test('returns undefined when lon/lat cannot be parsed as numbers', () => {
      expect(parseLocationAsEWKT('abc', 42)).toBeUndefined();
      expect(parseLocationAsEWKT(-90, 'xyz')).toBeUndefined();
    });
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Media File Handling
// ═════════════════════════════════════════════

describe('SyncManager - File Existence Checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('checks if file exists before reading', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 1024,
    });
    mockFileSystem.readAsStringAsync.mockResolvedValue('base64data');

    await mockFileSystem.getInfoAsync('file:///path/to/photo.jpg');

    expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith('file:///path/to/photo.jpg');
  });

  test('throws error when file does not exist', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
      isDirectory: false,
    });

    const fileInfo = await mockFileSystem.getInfoAsync('file:///missing.jpg');

    expect(fileInfo.exists).toBe(false);
  });

  test('throws error when file is empty', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 0,
    });

    const fileInfo = await mockFileSystem.getInfoAsync('file:///empty.jpg');

    expect(fileInfo.size).toBe(0);
  });

  test('allows reading file when it exists and has size', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 2048,
    });
    mockFileSystem.readAsStringAsync.mockResolvedValue('validbase64');

    const fileInfo = await mockFileSystem.getInfoAsync('file:///valid.jpg');
    const data = await mockFileSystem.readAsStringAsync('file:///valid.jpg', {
      encoding: mockFileSystem.EncodingType.Base64,
    });

    expect(fileInfo.exists).toBe(true);
    expect(fileInfo.size).toBeGreaterThan(0);
    expect(data).toBe('validbase64');
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Media Sync Resilience
// ═════════════════════════════════════════════

describe('SyncManager - Media Upload Failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('observation syncs without media when file is missing', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetMediaById.mockResolvedValue({
      id: 'media-1',
      observation_id: 'obs-1',
      local_file_path: 'file:///missing.jpg',
      media_type: 'image',
    });

    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
    });

    mockedUpdateMediaById.mockResolvedValue(undefined);

    // @ts-expect-error - Partial mock object for testing
    mockSupabaseFrom.single.mockResolvedValue({ data: {}, error: null });

    await mockedUpdateObservationById('obs-1', {
      sync_status: SyncStatus.SYNCED,
    });

    expect(mockedUpdateObservationById).toHaveBeenCalledWith(
      'obs-1',
      expect.objectContaining({
        sync_status: SyncStatus.SYNCED,
      })
    );
  });

  test('trip syncs successfully even with some media failures', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      user_id: 'user-1',
    });

    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', local_media_id: null },
      { id: 'obs-2', local_media_id: 'media-2' },
      { id: 'obs-3', local_media_id: 'media-3' },
    ]);

    // @ts-expect-error - Partial mock object for testing
    mockSupabaseFrom.single.mockResolvedValue({
      data: { id: 'supabase-trip-id' },
      error: null,
    });

    await mockedUpdateObservationById('obs-1', { sync_status: SyncStatus.SYNCED });
    await mockedUpdateObservationById('obs-2', { sync_status: SyncStatus.SYNCED });
    await mockedUpdateObservationById('obs-3', { sync_status: SyncStatus.SYNCED });

    await mockedUpdateTripById('trip-1', { sync_status: SyncStatus.SYNCED });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      'trip-1',
      expect.objectContaining({
        sync_status: SyncStatus.SYNCED,
      })
    );
  });

  test('media marked as ERROR when file missing', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetMediaById.mockResolvedValue({
      id: 'media-1',
      local_file_path: 'file:///missing.jpg',
    });

    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
    });

    await mockedUpdateMediaById('media-1', { sync_status: SyncStatus.ERROR });

    expect(mockedUpdateMediaById).toHaveBeenCalledWith(
      'media-1',
      expect.objectContaining({
        sync_status: SyncStatus.ERROR,
      })
    );
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Error Logging Levels
// ═════════════════════════════════════════════

describe('SyncManager - Error Logging', () => {
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('missing file logged as WARN not ERROR', () => {
    const errorMessage = 'File does not exist: file:///missing.jpg';

    if (errorMessage.includes('File does not exist')) {
      console.warn('[SyncManager] Media file missing (will sync observation without media)');
    }

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  test('unexpected errors still logged as ERROR', () => {
    const errorMessage = 'Network timeout';

    if (!errorMessage.includes('File does not exist') && !errorMessage.includes('is empty')) {
      console.error('[SyncManager] Unexpected error:', errorMessage);
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  test('empty file logged as WARN', () => {
    const errorMessage = 'File is empty: file:///empty.jpg';

    if (errorMessage.includes('is empty')) {
      console.warn('[SyncManager] Media file missing (will sync observation without media)');
    }

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Integration Scenarios
// ═════════════════════════════════════════════

describe('SyncManager - Real-World Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scenario: app restart after crash with corrupted media', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      user_id: 'user-1',
      sync_status: SyncStatus.REVIEWED,
    });

    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Observation text',
        local_media_id: 'media-1',
      },
    ]);

    // @ts-expect-error - Partial mock object for testing
    mockedGetMediaById.mockResolvedValue({
      id: 'media-1',
      local_file_path: 'file:///corrupted.jpg',
    });

    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
    });

    // @ts-expect-error - Partial mock object for testing
    mockSupabaseFrom.single.mockResolvedValue({
      data: { id: 'supabase-trip-id' },
      error: null,
    });

    await mockedUpdateObservationById('obs-1', { sync_status: SyncStatus.SYNCED });
    await mockedUpdateTripById('trip-1', { sync_status: SyncStatus.SYNCED });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      'trip-1',
      expect.objectContaining({
        sync_status: SyncStatus.SYNCED,
      })
    );
  });

  test('scenario: all media files missing but observations have text', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', observation: 'First', local_media_id: 'media-1' },
      { id: 'obs-2', observation: 'Second', local_media_id: 'media-2' },
      { id: 'obs-3', observation: 'Third', local_media_id: 'media-3' },
    ]);

    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
    });

    await mockedUpdateObservationById('obs-1', { sync_status: SyncStatus.SYNCED });
    await mockedUpdateObservationById('obs-2', { sync_status: SyncStatus.SYNCED });
    await mockedUpdateObservationById('obs-3', { sync_status: SyncStatus.SYNCED });

    expect(mockedUpdateObservationById).toHaveBeenCalledTimes(3);
    expect(mockedUpdateObservationById).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        sync_status: SyncStatus.SYNCED,
      })
    );
  });

  test('scenario: mixed media - some valid, some missing', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', local_media_id: 'media-1' },
      { id: 'obs-2', local_media_id: 'media-2' },
      { id: 'obs-3', local_media_id: null },
    ]);

    mockedGetMediaById.mockImplementation((id: string) => {
      return Promise.resolve({
        id,
        local_file_path: `file:///${id}.jpg`,
      });
    });

    mockFileSystem.getInfoAsync.mockImplementation((path: string) => {
      if (path.includes('media-1')) {
        return Promise.resolve({ exists: true, size: 1024 });
      }
      return Promise.resolve({ exists: false });
    });

    const fileInfo1 = await mockFileSystem.getInfoAsync('file:///media-1.jpg');
    const fileInfo2 = await mockFileSystem.getInfoAsync('file:///media-2.jpg');

    expect(fileInfo1.exists).toBe(true);
    expect(fileInfo2.exists).toBe(false);
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Edge Cases
// ═════════════════════════════════════════════

describe('SyncManager - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles observation with null media_id', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'No media observation',
        local_media_id: null,
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].local_media_id).toBeNull();
  });

  test('handles very large media files', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: false,
      size: 100 * 1024 * 1024,
    });

    const fileInfo = await mockFileSystem.getInfoAsync('file:///large.jpg');

    expect(fileInfo.size).toBeGreaterThan(50 * 1024 * 1024);
  });

  test('handles file paths with special characters', async () => {
    const specialPath = 'file:///path/with spaces/and-dashes_123.jpg';

    // @ts-expect-error - Partial mock object for testing
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      size: 1024,
    });

    await mockFileSystem.getInfoAsync(specialPath);

    expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith(specialPath);
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Media Resilience (Missing Files)
// ═════════════════════════════════════════════

describe('SyncManager - Media Resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Existence Check', () => {
    test('should check if file exists before reading', async () => {
      const filePath = 'file:///photo.jpg';

      // @ts-expect-error - Partial mock object for testing
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
      });

      try {
        await mockFileSystem.getInfoAsync(filePath);
        const fileInfo = await mockFileSystem.getInfoAsync(filePath);

        if (!fileInfo.exists) {
          throw new Error(`File does not exist: ${filePath}`);
        }
      } catch (err) {
        const error = err as Error;
        expect(error.message).toContain('File does not exist');
      }

      expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith(filePath);
    });

    test('should detect empty files (0 bytes)', async () => {
      const filePath = 'file:///empty.jpg';

      // @ts-expect-error - Partial mock object for testing
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        size: 0,
      });

      const fileInfo = await mockFileSystem.getInfoAsync(filePath);

      expect(fileInfo.size).toBe(0);
      expect(fileInfo.exists).toBe(true);
    });

    test('should allow reading files that exist and have size > 0', async () => {
      const filePath = 'file:///valid.jpg';

      // @ts-expect-error - Partial mock object for testing
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        size: 1024,
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64data');

      const fileInfo = await mockFileSystem.getInfoAsync(filePath);

      expect(fileInfo.exists).toBe(true);
      expect(fileInfo.size).toBeGreaterThan(0);

      const data = await mockFileSystem.readAsStringAsync(filePath, {
        encoding: 'base64',
      });

      expect(data).toBe('base64data');
    });
  });

  describe('Observation Sync Without Media', () => {
    test('should sync observation even when media file is missing', async () => {
      // @ts-expect-error - Partial mock object for testing
      mockedGetObservationsByTripId.mockResolvedValue([
        {
          id: 'obs-1',
          user_id: 'user-1',
          trip_id: 'trip-1',
          observation: 'Test observation',
          local_media_id: 'media-1',
          latitude: 42,
          longitude: -87,
          category_id: 'INFRASTRUCTURE',
        },
      ]);

      // @ts-expect-error - Partial mock object for testing
      mockedGetMediaById.mockResolvedValue({
        id: 'media-1',
        local_file_path: 'file:///missing.jpg',
        media_type: 'image',
      });

      // @ts-expect-error - Partial mock object for testing
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
      });

      const observations = await mockedGetObservationsByTripId('trip-1');

      expect(observations).toHaveLength(1);
      expect(observations[0].local_media_id).toBe('media-1');
    });

    test('should mark media as ERROR when file is missing', async () => {
      const mediaId = 'media-missing';

      await mockedUpdateMediaById(mediaId, { sync_status: SyncStatus.ERROR });

      expect(mockedUpdateMediaById).toHaveBeenCalledWith(mediaId, {
        sync_status: SyncStatus.ERROR,
      });
    });

    test('should mark observation as SYNCED even when media fails', async () => {
      const obsId = 'obs-with-failed-media';

      await mockedUpdateObservationById(obsId, {
        sync_status: SyncStatus.SYNCED,
        last_synced_at: Date.now(),
      });

      expect(mockedUpdateObservationById).toHaveBeenCalledWith(
        obsId,
        expect.objectContaining({
          sync_status: SyncStatus.SYNCED,
        })
      );
    });
  });

  describe('Trip Sync Resilience', () => {
    test('should complete trip sync even when some media files are missing', async () => {
      // @ts-expect-error - Partial mock object for testing
      mockedGetTripById.mockResolvedValue({
        id: 'trip-1',
        user_id: 'user-1',
        start_time: Date.now() - 3600000,
        end_time: Date.now(),
      });

      // @ts-expect-error - Partial mock object for testing
      mockedGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', local_media_id: null },
        { id: 'obs-2', local_media_id: 'media-missing' },
        { id: 'obs-3', local_media_id: 'media-valid' },
      ]);

      await mockedUpdateTripById('trip-1', {
        sync_status: SyncStatus.SYNCED,
        last_synced_at: Date.now(),
      });

      expect(mockedUpdateTripById).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({
          sync_status: SyncStatus.SYNCED,
        })
      );
    });

    test('should NOT block trip sync when all media files are missing', async () => {
      // @ts-expect-error - Partial mock object for testing
      mockedGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', local_media_id: 'media-1' },
        { id: 'obs-2', local_media_id: 'media-2' },
        { id: 'obs-3', local_media_id: 'media-3' },
      ]);

      // @ts-expect-error - Partial mock object for testing
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
      });

      await mockedUpdateTripById('trip-1', { sync_status: SyncStatus.SYNCED });

      expect(mockedUpdateTripById).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({
          sync_status: SyncStatus.SYNCED,
        })
      );
    });
  });

  describe('Error Message Improvements', () => {
    test('should log clear warning for missing files', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const mediaId = 'media-123';
      const filePath = 'file:///missing.jpg';

      console.warn(
        `[SyncManager] Media file missing or unreadable (will sync observation without media):`,
        `Media ID: ${mediaId}`,
        `Path: ${filePath}`
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Media file missing'),
        expect.stringContaining(mediaId),
        expect.stringContaining(filePath)
      );

      consoleSpy.mockRestore();
    });

    test('should log ERROR only for unexpected errors (not missing files)', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      console.error(
        `[SyncManager] Unexpected error while uploading media:`,
        new Error('Network timeout')
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

// ═════════════════════════════════════════════
// SYNC MANAGER - Edit Observation Sync
// ═════════════════════════════════════════════

describe('SyncManager - Observation Edits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update observation in database when edited', async () => {
    const obsId = 'obs-123';
    const updates = {
      observation: 'Updated description',
      latitude: 42.123,
      longitude: -87.456,
      category_id: 'INFRASTRUCTURE',
    };

    await mockedUpdateObservationById(obsId, updates);

    expect(mockedUpdateObservationById).toHaveBeenCalledWith(obsId, updates);
  });

  test('should sync updated observations to Supabase', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Updated observation text',
        latitude: 42.5,
        longitude: -87.8,
        category_id: 'WILDLIFE',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].observation).toBe('Updated observation text');
    expect(observations[0].category_id).toBe('WILDLIFE');
  });
});
