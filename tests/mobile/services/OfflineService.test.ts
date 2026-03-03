// tests/mobile/services/OfflineService.test.ts

import {
  OFFLINE_USER_ID,
  updateAndSyncOfflineDataToCurrentUser,
} from '@waterways/mobile/src/services/OfflineService';

// ---- Mocks ----
jest.mock('@waterways/shared/src/supabase/auth', () => ({
  getSession: jest.fn(),
}));

jest.mock('@waterways/mobile/src/database/TripManager', () => ({
  getTripsByUserId: jest.fn(),
  updateTripById: jest.fn(),
}));

jest.mock('@waterways/mobile/src/database/ObservationManager', () => ({
  getObservationsByUserId: jest.fn(),
  updateObservationById: jest.fn(),
}));

jest.mock('@waterways/mobile/src/services/NetworkService', () => ({
  performAutoSyncTaskOnce: jest.fn(),
}));

import { getSession } from '@waterways/shared/src/supabase/auth';
import { getTripsByUserId, updateTripById } from '@waterways/mobile/src/database/TripManager';
import {
  getObservationsByUserId,
  updateObservationById,
} from '@waterways/mobile/src/database/ObservationManager';
import { performAutoSyncTaskOnce } from '@waterways/mobile/src/services/NetworkService';

describe('OfflineService', () => {
  const getSessionMock = getSession as jest.MockedFunction<typeof getSession>;
  const getTripsByUserIdMock = getTripsByUserId as jest.MockedFunction<typeof getTripsByUserId>;
  const updateTripByIdMock = updateTripById as jest.MockedFunction<typeof updateTripById>;
  const getObservationsByUserIdMock = getObservationsByUserId as jest.MockedFunction<
    typeof getObservationsByUserId
  >;
  const updateObservationByIdMock = updateObservationById as jest.MockedFunction<
    typeof updateObservationById
  >;
  const performAutoSyncTaskOnceMock = performAutoSyncTaskOnce as jest.MockedFunction<
    typeof performAutoSyncTaskOnce
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns early when getSession returns an error (no updates, no sync)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: { message: 'session error' },
    } as unknown as Awaited<ReturnType<typeof getSession>>);

    await updateAndSyncOfflineDataToCurrentUser();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(getTripsByUserIdMock).not.toHaveBeenCalled();
    expect(updateTripByIdMock).not.toHaveBeenCalled();
    expect(getObservationsByUserIdMock).not.toHaveBeenCalled();
    expect(updateObservationByIdMock).not.toHaveBeenCalled();
    expect(performAutoSyncTaskOnceMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test('updates offline + local-user trips/observations to current user and triggers one-time sync', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const currentUserId = 'current-user-123';

    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: currentUserId } } },
      error: null,
    } as unknown as Awaited<ReturnType<typeof getSession>>);

    // Trips returned for OFFLINE_USER_ID and 'local-user' (temp block in OfflineService)
    getTripsByUserIdMock.mockImplementation(async (userId: string) => {
      if (userId === OFFLINE_USER_ID) {
        return [{ id: 'trip-off-1' }, { id: 'trip-off-2' }] as unknown as Awaited<
          ReturnType<typeof getTripsByUserId>
        >;
      }
      if (userId === 'local-user') {
        return [{ id: 'trip-local-1' }] as unknown as Awaited<ReturnType<typeof getTripsByUserId>>;
      }
      return [] as unknown as Awaited<ReturnType<typeof getTripsByUserId>>;
    });

    // Observations returned for OFFLINE_USER_ID and 'local-user'
    getObservationsByUserIdMock.mockImplementation(async (userId: string) => {
      if (userId === OFFLINE_USER_ID) {
        return [{ id: 'obs-off-1' }] as unknown as Awaited<
          ReturnType<typeof getObservationsByUserId>
        >;
      }
      if (userId === 'local-user') {
        return [{ id: 'obs-local-1' }, { id: 'obs-local-2' }] as unknown as Awaited<
          ReturnType<typeof getObservationsByUserId>
        >;
      }
      return [] as unknown as Awaited<ReturnType<typeof getObservationsByUserId>>;
    });

    await updateAndSyncOfflineDataToCurrentUser();

    // Session checked
    expect(getSessionMock).toHaveBeenCalledTimes(1);

    // Trips fetched for both OFFLINE_USER_ID and local-user (temp block)
    expect(getTripsByUserIdMock).toHaveBeenCalledWith(OFFLINE_USER_ID);
    expect(getTripsByUserIdMock).toHaveBeenCalledWith('local-user');

    // Each trip updated to current user
    expect(updateTripByIdMock).toHaveBeenCalledTimes(3);
    expect(updateTripByIdMock).toHaveBeenCalledWith('trip-off-1', { user_id: currentUserId });
    expect(updateTripByIdMock).toHaveBeenCalledWith('trip-off-2', { user_id: currentUserId });
    expect(updateTripByIdMock).toHaveBeenCalledWith('trip-local-1', { user_id: currentUserId });

    // Observations fetched for both OFFLINE_USER_ID and local-user (temp block)
    expect(getObservationsByUserIdMock).toHaveBeenCalledWith(OFFLINE_USER_ID);
    expect(getObservationsByUserIdMock).toHaveBeenCalledWith('local-user');

    // Each observation updated to current user
    expect(updateObservationByIdMock).toHaveBeenCalledTimes(3);
    expect(updateObservationByIdMock).toHaveBeenCalledWith('obs-off-1', { user_id: currentUserId });
    expect(updateObservationByIdMock).toHaveBeenCalledWith('obs-local-1', {
      user_id: currentUserId,
    });
    expect(updateObservationByIdMock).toHaveBeenCalledWith('obs-local-2', {
      user_id: currentUserId,
    });

    // One-time sync triggered at end
    expect(performAutoSyncTaskOnceMock).toHaveBeenCalledTimes(1);

    // Some log activity happened (not asserting exact strings to keep test stable)
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });

  test('catches unexpected errors from getSession and logs (no sync)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getSessionMock.mockRejectedValue(new Error('network blew up'));

    await updateAndSyncOfflineDataToCurrentUser();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(performAutoSyncTaskOnceMock).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
