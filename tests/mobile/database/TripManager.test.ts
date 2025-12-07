// tests/mobile/database/TripManager.test.ts

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-sqlite', () => require('../__mocks__/db'));

import { runAsyncMock, getAllAsyncMock } from '../__mocks__/db';

// schema mock (same idea as above)
const EXPECTED_SCHEMA_MOCK: Record<string, string[]> = {
  trips: ['id', 'user_id', 'created_at'],
};

jest.mock('@waterways/shared/src/database/schema', () => ({
  EXPECTED_SCHEMA: EXPECTED_SCHEMA_MOCK,
  CREATE_ALL_TABLES: ['CREATE TABLE trips (...);'],
  DROP_ALL_TABLES: ['DROP TABLE IF EXISTS trips;'],
}));

// Mock LocationService for TripManager
jest.mock('@waterways/mobile/src/services/LocationService', () => ({
  getCurrentCoordinates: jest.fn().mockResolvedValue({
    latitude: 33.33,
    longitude: -44.44,
  }),
}));

jest.mock('@waterways/shared/src/models/local-db-rows', () => ({}));

import {
  createTrip,
  getTripById,
  updateTripById,
  removeTripById,
} from '@waterways/mobile/src/database/TripManager';
import { SyncStatus } from '@waterways/mobile/src/database/SyncManager';

describe('TripManager', () => {
  const NOW = 1700000000000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    getAllAsyncMock.mockResolvedValue([]);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore?.();
  });

  test('createTrip inserts a new trip with generated id, timestamps, coordinates + defaults', async () => {
    const tripId = await createTrip({
      user_id: 'user-1',
      project_id: 'proj-1',
    });

    expect(typeof tripId).toBe('string');
    expect(runAsyncMock).toHaveBeenCalledTimes(1);

    const [sql, params] = runAsyncMock.mock.calls[0];

    expect(sql).toMatch(/INSERT INTO trips/);
    // id
    expect(params[0]).toBe(tripId);
    // supabase_id
    expect(params[1]).toBeNull();
    // user_id
    expect(params[2]).toBe('user-1');
    // project_id
    expect(params[3]).toBe('proj-1');
    // created_at
    expect(params[4]).toBe(NOW);
    // start_time (default NOW)
    expect(params[5]).toBe(NOW);
    // end_time
    expect(params[6]).toBeNull();
    // start_lat/long from LocationService
    expect(params[7]).toBe(33.33);
    expect(params[8]).toBe(-44.44);
    // end coords
    expect(params[9]).toBeNull();
    expect(params[10]).toBeNull();
    // sync_status
    expect(params[11]).toBe(SyncStatus.PENDING);
    // last_synced_at
    expect(params[12]).toBe(0);
  });

  test('createTrip uses provided start_time and coordinates if given', async () => {
    const customStart = NOW - 10000;

    const tripId = await createTrip({
      user_id: 'user-2',
      project_id: null,
      start_time: customStart,
      start_latitude: 10,
      start_longitude: 20,
    });

    const [, params] = runAsyncMock.mock.calls[runAsyncMock.mock.calls.length - 1];

    expect(params[0]).toBe(tripId);
    expect(params[3]).toBeNull(); // project_id
    expect(params[4]).toBe(NOW); // created_at
    expect(params[5]).toBe(customStart);
    expect(params[7]).toBe(10);
    expect(params[8]).toBe(20);
  });

  test('getTripById returns row when found', async () => {
    const row = {
      id: 'trip-1',
      user_id: 'user-1',
      created_at: NOW,
    } as any;

    getAllAsyncMock.mockImplementationOnce(async (sql: string, params?: any[]) => {
      if (sql.startsWith('SELECT * FROM trips WHERE id')) {
        expect(params).toEqual(['trip-1']);
        return [row];
      }
      return [];
    });

    const result = await getTripById('trip-1');
    expect(result).toEqual(row);
  });

  test('getTripById returns null when not found', async () => {
    getAllAsyncMock.mockImplementationOnce(async (sql: string) => {
      if (sql.startsWith('SELECT * FROM trips WHERE id')) {
        return [];
      }
      return [];
    });

    const result = await getTripById('missing');
    expect(result).toBeNull();
  });

  test('updateTripById builds correct UPDATE and params', async () => {
    await updateTripById('trip-99', {
      project_id: 'proj-new',
      end_time: NOW + 5000,
      sync_status: SyncStatus.SYNCED,
      last_synced_at: NOW + 10000,
    });

    expect(runAsyncMock).toHaveBeenCalledTimes(1);
    const [sql, params] = runAsyncMock.mock.calls[0];

    expect(sql).toBe(
      'UPDATE trips SET project_id = ?, end_time = ?, sync_status = ?, last_synced_at = ? WHERE id = ?'
    );

    expect(params).toEqual(['proj-new', NOW + 5000, SyncStatus.SYNCED, NOW + 10000, 'trip-99']);
  });

  test('updateTripById does nothing when no fields provided', async () => {
    await updateTripById('trip-123', {});
    expect(runAsyncMock).not.toHaveBeenCalled();
  });

  test('removeTripById deletes trip by id', async () => {
    await removeTripById('trip-123');

    expect(runAsyncMock).toHaveBeenCalledWith('DELETE FROM trips WHERE id = ?', ['trip-123']);
  });
});
