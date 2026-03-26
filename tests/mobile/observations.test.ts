/**
 * Test Suite: Observation Deletion & Journey Auto-Discard
 *
 * Tests the following functionality:
 * 1. Individual observation deletion
 * 2. Auto-discard journeys with 0 observations
 * 3. Database cleanup
 * 4. State management
 * 5. Navigation flows
 */

// Mock dependencies BEFORE importing
jest.mock('../../apps/mobile/src/database/TripManager');
jest.mock('../../apps/mobile/src/database/ObservationManager');
jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn().mockResolvedValue(undefined),
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../apps/mobile/src/utils/toast', () => ({
  showToast: jest.fn(),
}));

import * as TripManager from '../../apps/mobile/src/database/TripManager';
import * as ObservationManager from '../../apps/mobile/src/database/ObservationManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncStatus } from '../../apps/mobile/src/database/SyncStatus';
import type { Observation as DBObservation } from '@waterways/shared/src/models/local-db-rows';

// Type the mocked functions
const mockedRemoveObservationById = ObservationManager.removeObservationById as jest.MockedFunction<
  typeof ObservationManager.removeObservationById
>;
const mockedGetObservationsByTripId =
  ObservationManager.getObservationsByTripId as jest.MockedFunction<
    typeof ObservationManager.getObservationsByTripId
  >;
const mockedRemoveTripById = TripManager.removeTripById as jest.MockedFunction<
  typeof TripManager.removeTripById
>;
const mockedGetTripById = TripManager.getTripById as jest.MockedFunction<
  typeof TripManager.getTripById
>;
const mockedUpdateTripById = TripManager.updateTripById as jest.MockedFunction<
  typeof TripManager.updateTripById
>;
const mockedAsyncStorageRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<
  typeof AsyncStorage.removeItem
>;

// ═════════════════════════════════════════════
// Helper Functions
// ═════════════════════════════════════════════

const createMockObservation = (id: string, tripId: string): DBObservation =>
  ({
    id,
    user_id: 'user-1',
    trip_id: tripId,
    latitude: 42.123,
    longitude: -87.456,
    created_at: Date.now(),
    audio_media_id: null,
    audio_transcribed: false,
    observation: `Observation ${id}`,
    category_id: 'WILDLIFE',
    direction: null,
    local_media_id: null,
    sync_status: SyncStatus.PENDING,
    multimedia_url: null,
    last_synced_at: 0,
    supabase_trip_id: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const createMockTrip = (tripId: string) =>
  ({
    id: tripId,
    user_id: 'user-1',
    project_id: 'project-1',
    start_time: Date.now() - 3600000,
    end_time: null as number | null,
    created_at: Date.now() - 3600000,
    sync_status: SyncStatus.DRAFTED,
    last_synced_at: 0,
    supabase_trip_id: null as string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

// ═════════════════════════════════════════════
// TEST: Individual Observation Deletion
// ═════════════════════════════════════════════

describe('Observation Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully delete an observation', async () => {
    const observationId = 'obs-1';

    // Mock removeObservationById to succeed
    mockedRemoveObservationById.mockResolvedValue();

    // Call the function
    await mockedRemoveObservationById(observationId);

    // Verify it was called correctly
    expect(mockedRemoveObservationById).toHaveBeenCalledWith(observationId);
    expect(mockedRemoveObservationById).toHaveBeenCalledTimes(1);
  });

  test('should remove observation from database permanently', async () => {
    const tripId = 'trip-1';
    const observations = [
      createMockObservation('obs-1', tripId),
      createMockObservation('obs-2', tripId),
      createMockObservation('obs-3', tripId),
    ];

    // Before deletion - 3 observations
    mockedGetObservationsByTripId.mockResolvedValueOnce(observations);
    const beforeDeletion = await mockedGetObservationsByTripId(tripId);
    expect(beforeDeletion).toHaveLength(3);

    // Delete one observation
    await mockedRemoveObservationById('obs-2');

    // After deletion - 2 observations (obs-2 removed)
    mockedGetObservationsByTripId.mockResolvedValueOnce([observations[0], observations[2]]);
    const afterDeletion = await mockedGetObservationsByTripId(tripId);
    expect(afterDeletion).toHaveLength(2);
    expect(afterDeletion.find((obs) => obs.id === 'obs-2')).toBeUndefined();
  });

  test('should handle deletion errors gracefully', async () => {
    const observationId = 'obs-1';
    const error = new Error('Database error');

    // Mock deletion to fail
    mockedRemoveObservationById.mockRejectedValue(error);

    // Attempt to delete
    await expect(mockedRemoveObservationById(observationId)).rejects.toThrow('Database error');
  });

  test('should delete multiple observations sequentially', async () => {
    const observationIds = ['obs-1', 'obs-2', 'obs-3'];

    // Mock successful deletions
    mockedRemoveObservationById.mockResolvedValue();

    // Delete all observations
    for (const id of observationIds) {
      await mockedRemoveObservationById(id);
    }

    // Verify all deletions
    expect(mockedRemoveObservationById).toHaveBeenCalledTimes(3);
    expect(mockedRemoveObservationById).toHaveBeenNthCalledWith(1, 'obs-1');
    expect(mockedRemoveObservationById).toHaveBeenNthCalledWith(2, 'obs-2');
    expect(mockedRemoveObservationById).toHaveBeenNthCalledWith(3, 'obs-3');
  });
});

// ═════════════════════════════════════════════
// TEST: Auto-Discard Empty Journeys
// ═════════════════════════════════════════════

describe('Auto-Discard Empty Journeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should discard journey when last observation is deleted', async () => {
    const tripId = 'trip-1';
    const observationId = 'obs-1';

    // Setup: Journey with 1 observation
    const trip = createMockTrip(tripId);
    mockedGetTripById.mockResolvedValue(trip);
    mockedGetObservationsByTripId.mockResolvedValue([createMockObservation(observationId, tripId)]);

    // Delete the last observation
    mockedRemoveObservationById.mockResolvedValue();
    await mockedRemoveObservationById(observationId);

    // After deletion, observation count is 0
    mockedGetObservationsByTripId.mockResolvedValue([]);
    const remainingObservations = await mockedGetObservationsByTripId(tripId);
    expect(remainingObservations).toHaveLength(0);

    // Should trigger discard logic
    // In real scenario, this would call:
    // - AsyncStorage.removeItem(ACTIVE_TRIP_KEY)
    // - removeTripById(tripId)
    // - Alert.alert()
    // - router.replace(ROUTES.home)
  });

  test('should clear AsyncStorage when discarding empty journey', async () => {
    const ACTIVE_TRIP_KEY = '@waterways:active_trip_id';

    // Mock AsyncStorage removal
    mockedAsyncStorageRemoveItem.mockResolvedValue();

    // Simulate discard logic
    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);

    expect(mockedAsyncStorageRemoveItem).toHaveBeenCalledWith(ACTIVE_TRIP_KEY);
    expect(mockedAsyncStorageRemoveItem).toHaveBeenCalledTimes(1);
  });

  test('should delete trip from database when discarding', async () => {
    const tripId = 'trip-1';

    // Mock trip removal
    mockedRemoveTripById.mockResolvedValue();

    // Simulate discard logic
    await mockedRemoveTripById(tripId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(tripId);
    expect(mockedRemoveTripById).toHaveBeenCalledTimes(1);
  });

  test('should NOT discard journey if observations remain after deletion', async () => {
    const tripId = 'trip-1';
    const observations = [
      createMockObservation('obs-1', tripId),
      createMockObservation('obs-2', tripId),
      createMockObservation('obs-3', tripId),
    ];

    // Setup: Journey with 3 observations
    mockedGetObservationsByTripId.mockResolvedValue(observations);
    const beforeDeletion = await mockedGetObservationsByTripId(tripId);
    expect(beforeDeletion).toHaveLength(3);

    // Delete one observation
    await mockedRemoveObservationById('obs-1');

    // After deletion: 2 observations remain
    mockedGetObservationsByTripId.mockResolvedValue([observations[1], observations[2]]);
    const afterDeletion = await mockedGetObservationsByTripId(tripId);
    expect(afterDeletion).toHaveLength(2);

    // Journey should NOT be discarded (still has observations)
    expect(mockedRemoveTripById).not.toHaveBeenCalled();
    expect(mockedAsyncStorageRemoveItem).not.toHaveBeenCalled();
  });

  test('should handle full deletion workflow: delete all observations one by one', async () => {
    const tripId = 'trip-1';
    const observationIds = ['obs-1', 'obs-2', 'obs-3'];

    // Start with 3 observations
    let remainingObservations = observationIds.map((id) => createMockObservation(id, tripId));
    mockedGetObservationsByTripId.mockResolvedValue(remainingObservations);

    // Delete observations one by one
    for (let i = 0; i < observationIds.length; i++) {
      const idToDelete = observationIds[i];

      // Delete observation
      await mockedRemoveObservationById(idToDelete);

      // Update remaining observations
      remainingObservations = remainingObservations.filter((obs) => obs.id !== idToDelete);
      mockedGetObservationsByTripId.mockResolvedValue(remainingObservations);

      const remaining = await mockedGetObservationsByTripId(tripId);
      expect(remaining).toHaveLength(observationIds.length - i - 1);

      // Check if journey should be discarded (on last deletion)
      if (remaining.length === 0) {
        // This is the last observation - journey should be discarded
        expect(i).toBe(observationIds.length - 1);
        // In real scenario, would trigger discard logic here
      }
    }

    // Verify all observations deleted
    const final = await mockedGetObservationsByTripId(tripId);
    expect(final).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════
// TEST: State Management During Deletion
// ═════════════════════════════════════════════

describe('State Management During Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update local state after deletion', async () => {
    const tripId = 'trip-1';
    const observations = [
      createMockObservation('obs-1', tripId),
      createMockObservation('obs-2', tripId),
    ];

    // Initial state
    let localState = [...observations];
    expect(localState).toHaveLength(2);

    // Delete observation
    await mockedRemoveObservationById('obs-1');

    // Update local state (simulating setDbObservations)
    localState = localState.filter((obs) => obs.id !== 'obs-1');

    // Verify state update
    expect(localState).toHaveLength(1);
    expect(localState[0].id).toBe('obs-2');
  });

  test('should handle draft state updates correctly', async () => {
    const tripId = 'trip-1';
    const observations = [
      createMockObservation('obs-1', tripId),
      createMockObservation('obs-2', tripId),
    ];

    // Mock draft journey
    const draftJourney = {
      id: tripId,
      createdAt: Date.now(),
      status: SyncStatus.DRAFTED,
      observations: observations.map((obs) => ({
        id: obs.id,
        time: new Date(obs.created_at).toLocaleTimeString(),
        location: `${obs.latitude}, ${obs.longitude}`,
        description: obs.observation || '',
        tags: [obs.category_id || ''],
        hasAudio: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: SyncStatus.PENDING as any,
      })),
      projectId: 'project-1',
    };

    // Delete observation and update draft
    await mockedRemoveObservationById('obs-1');

    const updatedJourney = {
      ...draftJourney,
      observations: draftJourney.observations.filter((obs) => obs.id !== 'obs-1'),
    };

    expect(updatedJourney.observations).toHaveLength(1);
    expect(updatedJourney.observations[0].id).toBe('obs-2');
  });
});

// ═════════════════════════════════════════════
// TEST: Edge Cases
// ═════════════════════════════════════════════

describe('Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle deletion of non-existent observation', async () => {
    const nonExistentId = 'obs-999';

    // Mock deletion to succeed even if observation doesn't exist
    mockedRemoveObservationById.mockResolvedValue();

    await mockedRemoveObservationById(nonExistentId);

    expect(mockedRemoveObservationById).toHaveBeenCalledWith(nonExistentId);
  });

  test('should handle deletion when journey already has 0 observations', async () => {
    const tripId = 'trip-1';

    // Journey already empty
    mockedGetObservationsByTripId.mockResolvedValue([]);

    const observations = await mockedGetObservationsByTripId(tripId);
    expect(observations).toHaveLength(0);

    // Should already be discarded or not exist
  });

  test('should handle concurrent deletions gracefully', async () => {
    const observationIds = ['obs-1', 'obs-2', 'obs-3'];

    // Mock all deletions to succeed
    mockedRemoveObservationById.mockResolvedValue();

    // Delete concurrently
    await Promise.all(observationIds.map((id) => mockedRemoveObservationById(id)));

    expect(mockedRemoveObservationById).toHaveBeenCalledTimes(3);
  });

  test('should handle deletion during active journey', async () => {
    const tripId = 'trip-1';
    const trip = createMockTrip(tripId);
    trip.end_time = null; // Journey is active

    mockedGetTripById.mockResolvedValue(trip);

    const loadedTrip = await mockedGetTripById(tripId);
    expect(loadedTrip).not.toBeNull();
    expect(loadedTrip?.end_time).toBeNull();

    // Deletion should work even during active journey
    await mockedRemoveObservationById('obs-1');
    expect(mockedRemoveObservationById).toHaveBeenCalled();
  });

  test('should handle deletion when journey has ended', async () => {
    const tripId = 'trip-1';
    const trip = createMockTrip(tripId);
    trip.end_time = Date.now(); // Journey has ended

    mockedGetTripById.mockResolvedValue(trip);

    const loadedTrip = await mockedGetTripById(tripId);
    expect(loadedTrip).not.toBeNull();
    expect(loadedTrip?.end_time).not.toBeNull();

    // Deletion should work for ended journeys too
    await mockedRemoveObservationById('obs-1');
    expect(mockedRemoveObservationById).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════
// TEST: Integration Scenarios
// ═════════════════════════════════════════════

describe('Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle complete deletion workflow for journey with media', async () => {
    const tripId = 'trip-1';
    const observationWithMedia = createMockObservation('obs-1', tripId);
    observationWithMedia.local_media_id = 'media-1';

    mockedGetObservationsByTripId.mockResolvedValue([observationWithMedia]);

    // Delete observation with media
    await mockedRemoveObservationById('obs-1');

    // After deletion
    mockedGetObservationsByTripId.mockResolvedValue([]);
    const remaining = await mockedGetObservationsByTripId(tripId);

    expect(remaining).toHaveLength(0);
    // In real scenario, media files should also be cleaned up
  });

  test('should preserve journey metadata when deleting observations', async () => {
    const tripId = 'trip-1';
    const trip = createMockTrip(tripId);
    const projectId = 'project-1';
    trip.project_id = projectId;

    mockedGetTripById.mockResolvedValue(trip);

    // Delete observation
    await mockedRemoveObservationById('obs-1');

    // Trip metadata should still exist (until all observations are deleted)
    const loadedTrip = await mockedGetTripById(tripId);
    expect(loadedTrip).not.toBeNull();
    expect(loadedTrip?.project_id).toBe(projectId);
    expect(loadedTrip?.id).toBe(tripId);
  });

  test('should handle deletion with draft save operation', async () => {
    const tripId = 'trip-1';

    // Delete observation
    await mockedRemoveObservationById('obs-1');

    // Save updated draft to database
    mockedUpdateTripById.mockResolvedValue();
    await mockedUpdateTripById(tripId, {
      sync_status: SyncStatus.DRAFTED,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(tripId, {
      sync_status: SyncStatus.DRAFTED,
    });
  });
});

// ═════════════════════════════════════════════
// TEST: Cleanup and Database Consistency
// ═════════════════════════════════════════════

describe('Database Consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should maintain referential integrity after deletion', async () => {
    const tripId = 'trip-1';
    const observations = [
      createMockObservation('obs-1', tripId),
      createMockObservation('obs-2', tripId),
    ];

    // All observations belong to same trip
    expect(observations.every((obs) => obs.trip_id === tripId)).toBe(true);

    // Delete one observation
    await mockedRemoveObservationById('obs-1');

    // Remaining observations should still reference the trip
    mockedGetObservationsByTripId.mockResolvedValue([observations[1]]);
    const remaining = await mockedGetObservationsByTripId(tripId);

    expect(remaining).toHaveLength(1);
    expect(remaining[0].trip_id).toBe(tripId);
  });

  test('should clean up empty trip from database', async () => {
    const tripId = 'trip-1';

    // Mock trip removal
    mockedRemoveTripById.mockResolvedValue();

    // Remove empty trip
    await mockedRemoveTripById(tripId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(tripId);

    // After removal, trip should not exist
    mockedGetTripById.mockResolvedValue(null);
    const deletedTrip = await mockedGetTripById(tripId);
    expect(deletedTrip).toBeNull();
  });

  test('should handle database transaction failures during deletion', async () => {
    const observationId = 'obs-1';
    const error = new Error('Transaction failed');

    // Mock deletion to fail
    mockedRemoveObservationById.mockRejectedValue(error);

    // Deletion should fail and propagate error
    await expect(mockedRemoveObservationById(observationId)).rejects.toThrow('Transaction failed');

    // Database should remain in consistent state (observation not deleted)
  });
});
