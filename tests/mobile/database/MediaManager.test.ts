// tests/mobile/database/MediaManager.test.ts

// Auto-mock the db module (no factory function here)
jest.mock('@waterways/mobile/src/database/db');

// Other runtime-only modules
jest.mock('@waterways/shared/src/models/local-db-rows', () => ({}));

import * as dbModule from '@waterways/mobile/src/database/db';
import {
  addMedia,
  getMediaById,
  updateMediaById,
  removeMedia,
} from '@waterways/mobile/src/database/MediaManager';
import { SyncStatus } from '@waterways/mobile/src/database/SyncManager';

const mockGetDatabase = dbModule.getDatabase as jest.MockedFunction<typeof dbModule.getDatabase>;

let runAsyncMock: jest.Mock;
let getAllAsyncMock: jest.Mock;

describe('MediaManager', () => {
  const NOW = 1700000000000;

  type DbLike = {
    runAsync: jest.Mock;
    getAllAsync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    // fresh mocks for each test
    runAsyncMock = jest.fn().mockResolvedValue(undefined);
    getAllAsyncMock = jest.fn().mockResolvedValue([]);

    const db: DbLike = {
      runAsync: runAsyncMock,
      getAllAsync: getAllAsyncMock,
    };

    mockGetDatabase.mockResolvedValue(
      db as unknown as Awaited<ReturnType<typeof dbModule.getDatabase>>
    );
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore?.();
  });

  test('addMedia inserts a new row with defaults and generated values', async () => {
    // generateUUID: SELECT id FROM observation_media WHERE id = ?
    getAllAsyncMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT id FROM observation_media')) {
        return []; // no collision
      }
      return [];
    });

    const result = await addMedia({
      observation_id: 'obs-1',
      local_file_path: '/path/to/file.jpg',
      media_type: 'image',
      file_size: 1234,
    });

    expect(result.observation_id).toBe('obs-1');
    expect(result.local_file_path).toBe('/path/to/file.jpg');
    expect(result.media_type).toBe('image');
    expect(result.file_size).toBe(1234);
    expect(result.sync_status).toBe(SyncStatus.PENDING);
    expect(result.created_at).toBe(NOW);
    expect(result.last_synced_at).toBe(0);
    expect(typeof result.id).toBe('string');

    expect(runAsyncMock).toHaveBeenCalledTimes(1);
    const [sql, params] = runAsyncMock.mock.calls[0];

    expect(sql).toMatch(/INSERT OR REPLACE INTO observation_media/);
    expect(params).toEqual([
      result.id,
      NOW,
      'obs-1',
      '/path/to/file.jpg',
      'image',
      1234,
      SyncStatus.PENDING,
      0,
    ]);
  });

  test('addMedia uses provided id, created_at, sync_status, last_synced_at', async () => {
    const customId = 'custom-id';
    const createdAt = NOW - 1000;
    const syncedAt = NOW - 500;

    const result = await addMedia({
      id: customId,
      created_at: createdAt,
      last_synced_at: syncedAt,
      sync_status: SyncStatus.SYNCED,
      observation_id: 'obs-2',
      local_file_path: '/a/b/c.png',
    });

    expect(result.id).toBe(customId);
    expect(result.created_at).toBe(createdAt);
    expect(result.last_synced_at).toBe(syncedAt);
    expect(result.sync_status).toBe(SyncStatus.SYNCED);
  });

  test('getMediaById returns row when found', async () => {
    const row = {
      id: 'media-1',
      created_at: NOW,
      observation_id: 'obs-1',
      local_file_path: '/file.jpg',
      media_type: 'image',
      file_size: 1000,
      sync_status: SyncStatus.PENDING,
      last_synced_at: 0,
    };

    getAllAsyncMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.startsWith('SELECT * FROM observation_media WHERE id')) {
        expect(params).toEqual(['media-1']);
        return [row];
      }
      return [];
    });

    const result = await getMediaById('media-1');

    expect(getAllAsyncMock).toHaveBeenCalledWith(
      'SELECT * FROM observation_media WHERE id = ? LIMIT 1',
      ['media-1']
    );
    expect(result).toEqual(row);
  });

  test('getMediaById returns null when not found', async () => {
    getAllAsyncMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT * FROM observation_media WHERE id')) {
        return [];
      }
      return [];
    });

    const result = await getMediaById('missing-id');
    expect(result).toBeNull();
  });

  test('updateMediaById updates only provided allowed fields', async () => {
    // nothing to update
    await updateMediaById('media-1', {});
    expect(runAsyncMock).not.toHaveBeenCalled();

    await updateMediaById('media-2', {
      local_file_path: '/new/path.png',
      sync_status: SyncStatus.SYNCED,
      last_synced_at: NOW,
    });

    expect(runAsyncMock).toHaveBeenCalledTimes(1);
    const [sql, params] = runAsyncMock.mock.calls[0];

    expect(sql).toBe(
      'UPDATE observation_media SET local_file_path = ?, sync_status = ?, last_synced_at = ? WHERE id = ?'
    );
    expect(params).toEqual(['/new/path.png', SyncStatus.SYNCED, NOW, 'media-2']);
  });

  test('removeMedia deletes row by id', async () => {
    await removeMedia('media-3');

    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM observation_media WHERE id = ?', [
      'media-3',
    ]);
  });
});
