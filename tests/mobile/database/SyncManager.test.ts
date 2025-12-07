// tests/mobile/database/SyncManager.test.ts

// We don’t need expo-sqlite here unless SyncManager pulls db indirectly
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('expo-sqlite', () => require('../__mocks__/db'));

// Minimal mocks for the managers SyncManager talks to,
// just so the module can load without trying to hit real logic.
jest.mock('@waterways/mobile/src/database/TripManager', () => ({
  getTripById: jest.fn(),
  updateTripById: jest.fn(),
}));

jest.mock('@waterways/mobile/src/database/ObservationManager', () => ({
  getObservationsByTripId: jest.fn(),
  updateObservationById: jest.fn(),
}));

jest.mock('@waterways/mobile/src/database/MediaManager', () => ({
  getMediaById: jest.fn(),
  updateMediaById: jest.fn(),
}));

// Supabase client mock
jest.mock('@shared/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'supabase-trip-id' }, error: null }),
  },
}));

import {
  SyncStatus,
  parseDateTime,
  parseLocationAsEWKT,
} from '@waterways/mobile/src/database/SyncManager';

describe('SyncManager utility functions', () => {
  test('SyncStatus enum has expected values', () => {
    expect(SyncStatus.PENDING).toBe('pending');
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
