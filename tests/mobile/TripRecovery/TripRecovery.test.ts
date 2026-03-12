/**
 * Tests for trip recovery system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Create mock database object
const mockDb = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
};

const mockGetDatabase = jest.fn();
const mockGetObservationsByTripId = jest.fn();

// Mock the database
jest.mock('../../../apps/mobile/src/database/db', () => ({
  getDatabase: () => mockGetDatabase(),
}));

jest.mock('../../../apps/mobile/src/database/ObservationManager', () => ({
  getObservationsByTripId: (id: string) => mockGetObservationsByTripId(id),
}));

// Import after mocks
import {
  checkForIncompleteTrip,
  discardIncompleteTrip,
  resumeTrip,
  markJourneyEnding,
  autoSaveTripState,
} from '../../../apps/mobile/src/services/TripRecoveryService';

describe('Trip Recovery System', () => {
  const mockTripId = 'test-trip-123';
  const mockUserId = 'test-user-456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset database mock to return mockDb
    mockGetDatabase.mockResolvedValue(mockDb);

    // Reset AsyncStorage mocks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Test 1: Observations are Saved During Force Stop', () => {
    it('should persist observations when app is force-stopped', async () => {
      const mockTrip = {
        id: mockTripId,
        user_id: mockUserId,
        start_time: Date.now(),
        end_time: null, // No end_time = incomplete
        sync_status: null,
      };

      const mockObservations = [
        { id: 'obs-1', trip_id: mockTripId },
        { id: 'obs-2', trip_id: mockTripId },
      ];

      // Mock AsyncStorage to return active trip ID
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        if (key === '@waterways:app_state') return Promise.resolve('journey');
        if (key === '@waterways:last_auto_save') return Promise.resolve(Date.now().toString());
        return Promise.resolve(null);
      });

      // Mock database queries
      mockDb.getAllAsync.mockImplementation((query: string) => {
        // Trip query
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        // Media count query
        if (query.includes('media_type IN')) {
          return Promise.resolve([]);
        }
        // Observations with media
        if (query.includes('local_media_id IS NOT NULL')) {
          return Promise.resolve([{ count: 0 }]);
        }
        // Audio count
        if (query.includes("media_type = 'audio'")) {
          return Promise.resolve([{ count: 0 }]);
        }
        return Promise.resolve([]);
      });

      mockGetObservationsByTripId.mockResolvedValue(mockObservations);

      // Test auto-save
      await autoSaveTripState(mockTripId);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@waterways:last_auto_save',
        expect.any(String)
      );

      // Test check for incomplete trip
      const incompleteTrip = await checkForIncompleteTrip();

      expect(incompleteTrip).not.toBeNull();
      expect(incompleteTrip?.id).toBe(mockTripId);
      expect(incompleteTrip?.observationCount).toBe(2);
      expect(mockGetObservationsByTripId).toHaveBeenCalledWith(mockTripId);
    });
  });

  describe('Test 2: Photos/Videos are Saved During Force Stop', () => {
    it('should persist media files when app is force-stopped', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now(),
        end_time: null,
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        // Trip query
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        // Media count query - 1 image, 1 video
        if (query.includes('media_type IN')) {
          return Promise.resolve([
            { count: 1, media_type: 'image' },
            { count: 1, media_type: 'video' },
          ]);
        }
        // Observations with media
        if (query.includes('local_media_id IS NOT NULL')) {
          return Promise.resolve([{ count: 2 }]);
        }
        // Audio count
        if (query.includes("media_type = 'audio'")) {
          return Promise.resolve([{ count: 0 }]);
        }
        return Promise.resolve([]);
      });

      // FIXED: Return at least 1 observation (otherwise trip is considered empty and deleted)
      mockGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', trip_id: mockTripId, observation: 'Test observation' },
      ]);

      const incompleteTrip = await checkForIncompleteTrip();

      expect(incompleteTrip).not.toBeNull();
      expect(incompleteTrip?.mediaCount).toBe(2);
    });

    it('should not count audio recordings as photos/videos', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now(),
        end_time: null,
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        // 1 photo, but 3 audio files
        if (query.includes('media_type IN')) {
          return Promise.resolve([{ count: 1, media_type: 'image' }]);
        }
        if (query.includes('local_media_id IS NOT NULL')) {
          return Promise.resolve([{ count: 1 }]);
        }
        if (query.includes("media_type = 'audio'")) {
          return Promise.resolve([{ count: 3 }]); // 3 audio files
        }
        return Promise.resolve([]);
      });

      // FIXED: Return at least 1 observation (otherwise trip is considered empty and deleted)
      mockGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', trip_id: mockTripId, observation: 'Test observation with photo' },
      ]);

      const incompleteTrip = await checkForIncompleteTrip();

      // Should only count the 1 photo, NOT the 3 audio files
      expect(incompleteTrip).not.toBeNull();
      expect(incompleteTrip?.mediaCount).toBe(1);
    });
  });

  describe('Test 3: Trip Recovery Modal Detection', () => {
    it('should detect incomplete trip after force stop', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now() - 60000,
        end_time: null, // ← Key: no end_time
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        if (key === '@waterways:app_state') return Promise.resolve('journey');
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        return Promise.resolve([{ count: 0 }]);
      });

      // FIXED: Return at least 1 observation (otherwise trip is considered empty and deleted)
      mockGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', trip_id: mockTripId, observation: 'Force stop test observation' },
      ]);

      const incompleteTrip = await checkForIncompleteTrip();

      expect(incompleteTrip).not.toBeNull();
      expect(incompleteTrip?.id).toBe(mockTripId);
      expect(incompleteTrip?.isReviewing).toBe(false);
    });

    it('should NOT detect trip if it has end_time', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now() - 60000,
        end_time: Date.now(), // ← Has end_time = complete
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockResolvedValue([mockTrip]);

      const incompleteTrip = await checkForIncompleteTrip();

      expect(incompleteTrip).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:active_trip_id');
    });

    it('should NOT detect trip if no active trip ID in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const incompleteTrip = await checkForIncompleteTrip();

      expect(incompleteTrip).toBeNull();
      expect(mockGetDatabase).not.toHaveBeenCalled();
    });
  });

  describe('Test 4: Resume Trip Functionality', () => {
    it('should restore trip state when resumed', async () => {
      await resumeTrip(mockTripId, false);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@waterways:active_trip_id', mockTripId);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@waterways:app_state', 'journey');
    });
  });

  describe('Test 5: Discard Trip Functionality', () => {
    it('should delete all trip data when discarded', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 2 }]);
      mockDb.runAsync.mockResolvedValue({});

      await discardIncompleteTrip(mockTripId);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM observation_media'),
        expect.any(Array)
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM observations WHERE trip_id = ?'),
        [mockTripId]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM trips WHERE id = ?'),
        [mockTripId]
      );

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:active_trip_id');
    });
  });

  describe('Test 6: Graceful Journey End', () => {
    it('should clear recovery state when journey ends normally', async () => {
      await markJourneyEnding();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:active_trip_id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:last_auto_save');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@waterways:app_state', 'ended');
    });
  });

  describe('Test 7: Multiple Force Stops', () => {
    it('should persist trip data across multiple force stops', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now() - 300000,
        end_time: null,
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        return Promise.resolve([{ count: 0 }]);
      });

      // FIXED: Return at least 1 observation (otherwise trip is considered empty and deleted)
      mockGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', trip_id: mockTripId, observation: 'Multiple force stops test observation' },
      ]);

      const firstCheck = await checkForIncompleteTrip();
      expect(firstCheck).not.toBeNull();
      expect(firstCheck?.id).toBe(mockTripId);

      const secondCheck = await checkForIncompleteTrip();
      expect(secondCheck).not.toBeNull();
      expect(secondCheck?.id).toBe(mockTripId);
    });
  });

  describe('Test 8: Empty Journey Cleanup (0 Observations)', () => {
    it('should delete trip and return null when trip has 0 observations', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now(),
        end_time: null,
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        return Promise.resolve([{ count: 0 }]);
      });

      // Empty journey - 0 observations
      mockGetObservationsByTripId.mockResolvedValue([]);

      const incompleteTrip = await checkForIncompleteTrip();

      // Should return null for empty journey
      expect(incompleteTrip).toBeNull();

      // Should delete the trip from database
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM trips WHERE id = ?', [mockTripId]);

      // Should clear AsyncStorage
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:active_trip_id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:last_auto_save');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@waterways:app_state');
    });

    it('should NOT delete trip when it has at least 1 observation', async () => {
      const mockTrip = {
        id: mockTripId,
        start_time: Date.now(),
        end_time: null,
        sync_status: null,
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@waterways:active_trip_id') return Promise.resolve(mockTripId);
        return Promise.resolve(null);
      });

      mockDb.getAllAsync.mockImplementation((query: string) => {
        if (query.includes('SELECT id, start_time, end_time')) {
          return Promise.resolve([mockTrip]);
        }
        return Promise.resolve([{ count: 0 }]);
      });

      // Journey has 1 observation
      mockGetObservationsByTripId.mockResolvedValue([
        { id: 'obs-1', trip_id: mockTripId, observation: 'At least one observation' },
      ]);

      const incompleteTrip = await checkForIncompleteTrip();

      // Should return trip data for non-empty journey
      expect(incompleteTrip).not.toBeNull();
      expect(incompleteTrip?.observationCount).toBe(1);

      // Should NOT delete the trip
      expect(mockDb.runAsync).not.toHaveBeenCalled();
    });
  });
});
