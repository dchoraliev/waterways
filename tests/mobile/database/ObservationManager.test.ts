jest.mock('@waterways/mobile/src/database/db');
jest.mock('@waterways/mobile/src/services/LocationService', () => ({
  getCurrentCoordinates: jest.fn().mockResolvedValue({
    latitude: 11.11,
    longitude: 22.22,
  }),
}));
jest.mock('@waterways/shared/src/models/local-db-rows', () => ({}));

import * as dbModule from '@waterways/mobile/src/database/db';
import {
  createObservation,
  getObservationById,
  getObservationsByTripId,
  updateObservationById,
  removeObservationById,
} from '@waterways/mobile/src/database/ObservationManager';
import { SyncStatus } from '@waterways/mobile/src/database/SyncManager';

const mockGetDatabase = dbModule.getDatabase as jest.MockedFunction<typeof dbModule.getDatabase>;

// Define proper type for observation row
interface ObservationRow {
  id: string;
  user_id: string;
  trip_id: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: number;
  audio_media_id?: string | null;
  audio_transcribed?: number | null;
  observation?: string | null;
  category_id?: string | null;
  direction?: string | null;
  local_media_id?: string | null;
  sync_status?: string | null;
  multimedia_url?: string | null;
  last_synced_at?: number | null;
}

let runAsyncMock: jest.Mock;
let getAllAsyncMock: jest.Mock;

describe('ObservationManager', () => {
  const NOW = 1700000000000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);

    runAsyncMock = jest.fn().mockResolvedValue(undefined);
    getAllAsyncMock = jest.fn().mockResolvedValue([]);

    // Cast through unknown to bypass type checking for mocks
    mockGetDatabase.mockResolvedValue({
      runAsync: runAsyncMock,
      getAllAsync: getAllAsyncMock,
    } as unknown as Awaited<ReturnType<typeof dbModule.getDatabase>>);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore?.();
  });

  test('createObservation inserts with generated id, timestamp, coordinates + defaults', async () => {
    // UUID generation:
    // SELECT id FROM observations WHERE id = ?
    getAllAsyncMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT id FROM observations')) {
        return [];
      }
      return [];
    });

    const obsId = await createObservation({
      user_id: 'user-1',
      trip_id: 'trip-1',
      observation: 'Nice water quality',
      category_id: 'cat-1',
      direction: 'N',
      audio_transcribed: true,
      local_media_id: 'media-1',
    });

    expect(typeof obsId).toBe('string');
    expect(runAsyncMock).toHaveBeenCalledTimes(1);

    const [sql, params] = runAsyncMock.mock.calls[0];

    expect(sql).toMatch(/INSERT INTO observations/);
    expect(params[0]).toBe(obsId); // id
    expect(params[1]).toBe('user-1'); // user_id
    expect(params[2]).toBe('trip-1'); // trip_id
    // Note: schema includes supabase_trip_id and supabase_audio_media_id before latitude/audio_media_id
    expect(params[3]).toBeNull(); // supabase_trip_id
    expect(params[4]).toBe(11.11); // latitude
    expect(params[5]).toBe(22.22); // longitude
    expect(params[6]).toBe(NOW); // created_at
    expect(params[7]).toBeNull(); // audio_media_id
    expect(params[8]).toBeNull(); // supabase_audio_media_id
    expect(params[9]).toBe(1); // audio_transcribed
    expect(params[10]).toBe('Nice water quality'); // observation
    expect(params[11]).toBe('cat-1'); // category_id
    expect(params[12]).toBe('N'); // direction
    expect(params[13]).toBe('media-1'); // local_media_id
    expect(params[14]).toBe(SyncStatus.PENDING);
    expect(params[15]).toBeNull(); // multimedia_url
    expect(params[16]).toBe(0); // last_synced_at
  });

  test('createObservation uses provided coordinates instead of LocationService', async () => {
    getAllAsyncMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT id FROM observations')) {
        return [];
      }
      return [];
    });

    const obsId = await createObservation({
      user_id: 'user-2',
      trip_id: 'trip-2',
      latitude: 44.4,
      longitude: -90.9,
    });

    const [, params] = runAsyncMock.mock.calls[runAsyncMock.mock.calls.length - 1];

    expect(params[0]).toBe(obsId);
    expect(params[1]).toBe('user-2');
    expect(params[2]).toBe('trip-2');
    // account for inserted supabase_trip_id placeholder
    expect(params[3]).toBeNull();
    expect(params[4]).toBe(44.4);
    expect(params[5]).toBe(-90.9);
  });

  test('getObservationById returns row when found', async () => {
    const row: ObservationRow = {
      id: 'obs-1',
      user_id: 'user-1',
      trip_id: 'trip-1',
      created_at: NOW,
    };

    getAllAsyncMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.startsWith('SELECT * FROM observations WHERE id')) {
        expect(params).toEqual(['obs-1']);
        return [row];
      }
      return [];
    });

    const result = await getObservationById('obs-1');

    expect(getAllAsyncMock).toHaveBeenCalledWith(
      'SELECT * FROM observations WHERE id = ? LIMIT 1',
      ['obs-1']
    );
    expect(result).toEqual(row);
  });

  test('getObservationById returns null when not found', async () => {
    getAllAsyncMock.mockImplementation(async (sql: string) => {
      if (sql.startsWith('SELECT * FROM observations WHERE id')) {
        return [];
      }
      return [];
    });

    const result = await getObservationById('missing');
    expect(result).toBeNull();
  });

  test('getObservationsByTripId returns all rows for a trip', async () => {
    const rows: ObservationRow[] = [
      { id: 'obs-1', user_id: 'user-1', trip_id: 'trip-1', created_at: NOW },
      { id: 'obs-2', user_id: 'user-1', trip_id: 'trip-1', created_at: NOW },
    ];

    getAllAsyncMock.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.startsWith('SELECT * FROM observations WHERE trip_id')) {
        expect(params).toEqual(['trip-1']);
        return rows;
      }
      return [];
    });

    const result = await getObservationsByTripId('trip-1');
    expect(result).toEqual(rows);
  });

  test('updateObservationById builds correct UPDATE with boolean conversion', async () => {
    await updateObservationById('obs-99', {
      observation: 'Updated note',
      audio_transcribed: true,
      sync_status: SyncStatus.SYNCED,
    });

    expect(runAsyncMock).toHaveBeenCalledTimes(1);
    const [sql, params] = runAsyncMock.mock.calls[0];

    // order based on allowedKeys in ObservationManager:
    // audio_transcribed, observation, sync_status
    expect(sql).toBe(
      'UPDATE observations SET audio_transcribed = ?, observation = ?, sync_status = ? WHERE id = ?'
    );
    expect(params).toEqual([1, 'Updated note', SyncStatus.SYNCED, 'obs-99']);
  });

  test('removeObservationById deletes observation by id', async () => {
    await removeObservationById('obs-123');

    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM observations WHERE id = ?', ['obs-123']);
  });
});
