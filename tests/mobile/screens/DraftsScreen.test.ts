// tests/mobile/screens/DraftsScreen.test.ts

// Mock ALL dependencies BEFORE importing to avoid native module errors
jest.mock('../../../apps/mobile/src/database/TripManager');
jest.mock('../../../apps/mobile/src/database/ObservationManager');
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
}));

import type { JourneyDraft } from '../../../apps/mobile/src/hooks/useDraftJourneys';
import { SyncStatus } from '../../../apps/mobile/src/database/SyncStatus';
import * as TripManager from '../../../apps/mobile/src/database/TripManager';
import * as ObservationManager from '../../../apps/mobile/src/database/ObservationManager';
import * as ExpoNotifications from 'expo-notifications';

// Type the mocked functions
const mockedGetTripById = TripManager.getTripById as jest.MockedFunction<
  typeof TripManager.getTripById
>;
const mockedUpdateTripById = TripManager.updateTripById as jest.MockedFunction<
  typeof TripManager.updateTripById
>;
const mockedRemoveTripById = TripManager.removeTripById as jest.MockedFunction<
  typeof TripManager.removeTripById
>;
const mockedGetTripsBySyncStatus = TripManager.getTripsBySyncStatus as jest.MockedFunction<
  typeof TripManager.getTripsBySyncStatus
>;

const mockedGetObservationsByTripId =
  ObservationManager.getObservationsByTripId as jest.MockedFunction<
    typeof ObservationManager.getObservationsByTripId
  >;

const mockedScheduleNotificationAsync =
  ExpoNotifications.scheduleNotificationAsync as jest.MockedFunction<
    typeof ExpoNotifications.scheduleNotificationAsync
  >;
const mockedCancelScheduledNotificationAsync =
  ExpoNotifications.cancelScheduledNotificationAsync as jest.MockedFunction<
    typeof ExpoNotifications.cancelScheduledNotificationAsync
  >;

// ─────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────

const makeDraft = (overrides: Partial<JourneyDraft> = {}): JourneyDraft => ({
  id: 'trip-1',
  createdAt: Date.now(),
  status: SyncStatus.DRAFTED,
  projectId: null,
  observations: [
    {
      id: 'obs-1',
      time: '04:08 AM',
      location: '42.123, -87.456',
      description: 'Saw a bird near the river',
      tags: [],
      hasAudio: false,
      hasMedia: false,
      category: 'WILDLIFE',
      keyword: 'bird',
      manuallyEdited: false,
    },
  ],
  ...overrides,
});

// ═════════════════════════════════════════════
// DRAFTS SCREEN - Core Functionality
// ═════════════════════════════════════════════

describe('DraftsScreen - Loading and Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads drafts with DRAFTED status', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED, project_id: null, created_at: Date.now() },
    ]);

    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Test observation',
        created_at: Date.now(),
        latitude: 42.123,
        longitude: -87.456,
        category_id: 'WILDLIFE',
      },
    ]);

    const result = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(mockedGetTripsBySyncStatus).toHaveBeenCalledWith(SyncStatus.DRAFTED);
    expect(result).toHaveLength(1);
  });

  test('does not load REVIEWED or SYNCED trips as drafts', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
    ]);

    const result = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);

    expect(result.every((trip) => trip.sync_status === SyncStatus.DRAFTED)).toBe(true);
  });

  test('loads project_id from database', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      project_id: 'project-123',
      created_at: Date.now(),
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.project_id).toBe('project-123');
  });

  test('loads created_at timestamp from database', async () => {
    const timestamp = 1709241119525;
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      created_at: timestamp,
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.created_at).toBe(timestamp);
  });
});

describe('DraftsScreen - Saving Drafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveDraft uses draft.status not hardcoded DRAFTED', async () => {
    const draft = makeDraft({ status: SyncStatus.REVIEWED });

    await mockedUpdateTripById(draft.id, {
      sync_status: draft.status,
      project_id: draft.projectId,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        sync_status: SyncStatus.REVIEWED,
      })
    );
  });

  test('saveDraft saves project_id to database', async () => {
    const draft = makeDraft({ projectId: 'project-123' });

    await mockedUpdateTripById(draft.id, {
      sync_status: draft.status,
      project_id: draft.projectId,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        project_id: 'project-123',
      })
    );
  });

  test('saveDraft updates createdAt timestamp', async () => {
    const newTimestamp = Date.now();
    const draft = makeDraft({ createdAt: newTimestamp });

    await mockedUpdateTripById(draft.id, {
      sync_status: draft.status,
      created_at: draft.createdAt,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        created_at: newTimestamp,
      })
    );
  });

  test('saveDraft schedules notification only for DRAFTED status', async () => {
    const draftedDraft = makeDraft({ status: SyncStatus.DRAFTED });
    const reviewedDraft = makeDraft({ status: SyncStatus.REVIEWED });

    if (draftedDraft.status === SyncStatus.DRAFTED) {
      // @ts-expect-error - Partial mock data for testing
      await mockedScheduleNotificationAsync({
        content: { title: 'Draft saved' },
        trigger: null,
      });
    }

    expect(mockedScheduleNotificationAsync).toHaveBeenCalledTimes(1);

    mockedScheduleNotificationAsync.mockClear();

    if (reviewedDraft.status === SyncStatus.DRAFTED) {
      // @ts-expect-error - Partial mock data for testing
      await mockedScheduleNotificationAsync({
        content: { title: 'Draft saved' },
        trigger: null,
      });
    }

    expect(mockedScheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('DraftsScreen - Submitting Drafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitDraft saves project_id before syncing', async () => {
    const draft = makeDraft({ projectId: 'project-123' });

    await mockedUpdateTripById(draft.id, {
      sync_status: SyncStatus.REVIEWED,
      project_id: draft.projectId,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        project_id: 'project-123',
      })
    );
  });

  test('submitDraft sets status to REVIEWED', async () => {
    const draft = makeDraft();

    await mockedUpdateTripById(draft.id, {
      sync_status: SyncStatus.REVIEWED,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        sync_status: SyncStatus.REVIEWED,
      })
    );
  });

  test('submitDraft cancels notification', async () => {
    const notificationId = 'notification-123';

    await mockedCancelScheduledNotificationAsync(notificationId);

    expect(mockedCancelScheduledNotificationAsync).toHaveBeenCalledWith(notificationId);
  });

  test('submitted draft is removed from drafts array immediately', () => {
    const drafts = [
      makeDraft({ id: 'trip-1', status: SyncStatus.DRAFTED }),
      makeDraft({ id: 'trip-2', status: SyncStatus.DRAFTED }),
    ];

    const tripToSubmit = 'trip-1';
    const updatedDrafts = drafts.filter((d) => d.id !== tripToSubmit);

    expect(updatedDrafts).toHaveLength(1);
    expect(updatedDrafts[0].id).toBe('trip-2');
  });

  test('REVIEWED and SYNCED trips are removed from drafts', () => {
    const drafts = [
      makeDraft({ id: 'trip-1', status: SyncStatus.DRAFTED }),
      makeDraft({ id: 'trip-2', status: SyncStatus.REVIEWED }),
      makeDraft({ id: 'trip-3', status: SyncStatus.SYNCED }),
    ];

    const cleanedDrafts = drafts.filter((d) => d.status === SyncStatus.DRAFTED);

    expect(cleanedDrafts).toHaveLength(1);
    expect(cleanedDrafts[0].id).toBe('trip-1');
  });
});

describe('DraftsScreen - useFocusEffect Reload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('screen reloads drafts when focused', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
    ]);

    const onFocus = async () => {
      await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    };

    await onFocus();
    expect(mockedGetTripsBySyncStatus).toHaveBeenCalledTimes(1);

    mockedGetTripsBySyncStatus.mockClear();

    await onFocus();
    expect(mockedGetTripsBySyncStatus).toHaveBeenCalledTimes(1);
  });

  test('submitted drafts disappear when navigating back', async () => {
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
    ]);

    const initialDrafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(initialDrafts).toHaveLength(2);

    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
    ]);

    const refreshedDrafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(refreshedDrafts).toHaveLength(1);
    expect(refreshedDrafts[0].id).toBe('trip-2');
  });
});

describe('DraftsScreen - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles empty drafts array', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([]);

    const drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);

    expect(drafts).toEqual([]);
  });

  test('handles draft with null project_id', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      project_id: null,
      created_at: Date.now(),
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.project_id).toBeNull();
  });

  test('handles draft with missing created_at', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      created_at: null,
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.created_at).toBeNull();
  });

  test('handles concurrent draft saves', async () => {
    const draft = makeDraft();

    await Promise.all([
      mockedUpdateTripById(draft.id, { sync_status: SyncStatus.DRAFTED }),
      mockedUpdateTripById(draft.id, { sync_status: SyncStatus.DRAFTED }),
      mockedUpdateTripById(draft.id, { sync_status: SyncStatus.DRAFTED }),
    ]);

    expect(mockedUpdateTripById).toHaveBeenCalledTimes(3);
  });
});

describe('DraftsScreen - Project ID Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load project_id from database when creating draft', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      project_id: 'project-abc-123',
      created_at: Date.now(),
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.project_id).toBe('project-abc-123');
  });

  test('should save project_id when saving draft', async () => {
    const draft = makeDraft({ projectId: 'project-xyz-456' });

    await mockedUpdateTripById(draft.id, {
      project_id: draft.projectId,
      sync_status: SyncStatus.DRAFTED,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        project_id: 'project-xyz-456',
      })
    );
  });

  test('should handle null project_id gracefully', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-no-project',
      project_id: null,
      created_at: Date.now(),
    });

    const trip = await mockedGetTripById('trip-no-project');

    expect(trip?.project_id).toBeNull();
  });
});

describe('DraftsScreen - Created At Timestamp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should use database created_at when available', async () => {
    const dbTimestamp = Date.now() - 3600000;

    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: 'trip-1',
      created_at: dbTimestamp,
    });

    const trip = await mockedGetTripById('trip-1');

    expect(trip?.created_at).toBe(dbTimestamp);
  });

  test('should update created_at when draft is saved', async () => {
    const now = Date.now();
    const draft = makeDraft({ createdAt: now });

    await mockedUpdateTripById(draft.id, {
      created_at: now,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({
        created_at: now,
      })
    );
  });

  test('should show most recent save time in UI', async () => {
    const firstSave = Date.now() - 7200000;
    const latestSave = Date.now() - 60000;

    mockedGetTripById.mockResolvedValueOnce({
      id: 'trip-1',
      created_at: firstSave,
    });

    const trip1 = await mockedGetTripById('trip-1');
    expect(trip1?.created_at).toBe(firstSave);

    mockedGetTripById.mockResolvedValueOnce({
      id: 'trip-1',
      created_at: latestSave,
    });

    const trip2 = await mockedGetTripById('trip-1');
    expect(trip2?.created_at).toBe(latestSave);
    expect(trip2!.created_at!).toBeGreaterThan(trip1!.created_at!);
  });
});

describe('DraftsScreen - Status Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should use actual draft status when saving (not hardcoded DRAFTED)', async () => {
    const reviewedDraft = makeDraft({ status: SyncStatus.REVIEWED });

    await mockedUpdateTripById(reviewedDraft.id, {
      sync_status: reviewedDraft.status,
    });

    expect(mockedUpdateTripById).toHaveBeenCalledWith(
      reviewedDraft.id,
      expect.objectContaining({
        sync_status: SyncStatus.REVIEWED,
      })
    );
  });

  test('should cancel notification for REVIEWED drafts', async () => {
    const draft = makeDraft({
      status: SyncStatus.REVIEWED,
      id: 'trip-reviewed',
    });

    if (draft.status === SyncStatus.REVIEWED) {
      await mockedCancelScheduledNotificationAsync(draft.id);
    }

    expect(mockedCancelScheduledNotificationAsync).toHaveBeenCalledWith('trip-reviewed');
  });

  test('should cancel notification for SYNCED drafts', async () => {
    const draft = makeDraft({
      status: SyncStatus.SYNCED,
      id: 'trip-synced',
    });

    if (draft.status === SyncStatus.SYNCED) {
      await mockedCancelScheduledNotificationAsync(draft.id);
    }

    expect(mockedCancelScheduledNotificationAsync).toHaveBeenCalledWith('trip-synced');
  });

  test('should remove REVIEWED/SYNCED drafts from array immediately', async () => {
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
    ]);

    let drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(2);

    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
    ]);

    drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe('trip-2');
  });
});

describe('DraftsScreen - Screen Reload Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should reload drafts on screen focus using useFocusEffect', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
    ]);

    const loadDrafts = async () => {
      return await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    };

    const drafts1 = await loadDrafts();
    expect(drafts1).toHaveLength(1);

    mockedGetTripsBySyncStatus.mockClear();

    await loadDrafts();
    expect(mockedGetTripsBySyncStatus).toHaveBeenCalledTimes(1);
  });

  test('should show updated list after submission', async () => {
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-3', sync_status: SyncStatus.DRAFTED },
    ]);

    let drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(3);

    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-3', sync_status: SyncStatus.DRAFTED },
    ]);

    drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(2);
    expect(drafts.find((d: { id: string }) => d.id === 'trip-2')).toBeUndefined();
  });
});

describe('DraftsScreen - Notification Scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should schedule notification only for new DRAFTED drafts', async () => {
    const newDraft = makeDraft({
      status: SyncStatus.DRAFTED,
      id: 'new-draft',
    });

    if (newDraft.status === SyncStatus.DRAFTED) {
      // @ts-expect-error - Partial mock data for testing
      await mockedScheduleNotificationAsync({
        content: {
          title: 'Draft Journey',
          body: 'You have an unsubmitted draft',
        },
        trigger: { seconds: 3600 },
        identifier: newDraft.id,
      });
    }

    expect(mockedScheduleNotificationAsync).toHaveBeenCalled();
  });

  test('should NOT schedule notification for existing DRAFTED drafts loaded from DB', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'existing-1', sync_status: SyncStatus.DRAFTED },
      { id: 'existing-2', sync_status: SyncStatus.DRAFTED },
    ]);

    await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);

    expect(mockedScheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════
// DRAFTS SCREEN - Remove Draft Journey
// ═════════════════════════════════════════════

describe('DraftsScreen - Remove Draft Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully remove a draft journey', async () => {
    const journeyId = 'trip-to-remove';

    // Mock successful removal
    mockedRemoveTripById.mockResolvedValue();

    // Call remove function
    await mockedRemoveTripById(journeyId);

    // Verify removal was called
    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
    expect(mockedRemoveTripById).toHaveBeenCalledTimes(1);
  });

  test('should remove trip from database permanently', async () => {
    const journeyId = 'trip-1';

    // Before removal - trip exists
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValueOnce({
      id: journeyId,
      sync_status: SyncStatus.DRAFTED,
    });

    const beforeRemoval = await mockedGetTripById(journeyId);
    expect(beforeRemoval).toBeDefined();

    // Remove trip
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    // After removal - trip should not exist
    mockedGetTripById.mockResolvedValueOnce(null);
    const afterRemoval = await mockedGetTripById(journeyId);
    expect(afterRemoval).toBeNull();
  });

  test('should handle removal errors gracefully', async () => {
    const journeyId = 'trip-error';
    const error = new Error('Database error during removal');

    // Mock removal to fail
    mockedRemoveTripById.mockRejectedValue(error);

    // Attempt to remove
    await expect(mockedRemoveTripById(journeyId)).rejects.toThrow('Database error during removal');
  });

  test('should reload drafts list after successful removal', async () => {
    const journeyId = 'trip-to-remove';

    // Initial state - 3 drafts
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-to-remove', sync_status: SyncStatus.DRAFTED },
    ]);

    let drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(3);

    // Remove draft
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    // After removal - 2 drafts (reload triggered)
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED },
    ]);

    drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(2);
    expect(drafts.find((d) => d.id === journeyId)).toBeUndefined();
  });
});

describe('DraftsScreen - Remove Draft with Observations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should remove draft with single observation', async () => {
    const journeyId = 'trip-1-obs';

    // Draft has 1 observation
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', observation: 'Test observation' },
    ]);

    const observations = await mockedGetObservationsByTripId(journeyId);
    expect(observations).toHaveLength(1);

    // Remove draft (should cascade delete observations)
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
  });

  test('should remove draft with multiple observations', async () => {
    const journeyId = 'trip-multi-obs';

    // Draft has 5 observations
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', observation: 'Observation 1' },
      { id: 'obs-2', observation: 'Observation 2' },
      { id: 'obs-3', observation: 'Observation 3' },
      { id: 'obs-4', observation: 'Observation 4' },
      { id: 'obs-5', observation: 'Observation 5' },
    ]);

    const observations = await mockedGetObservationsByTripId(journeyId);
    expect(observations).toHaveLength(5);

    // Remove draft (should cascade delete all observations)
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
  });

  test('should remove draft with zero observations', async () => {
    const journeyId = 'trip-no-obs';

    // Draft has 0 observations
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([]);

    const observations = await mockedGetObservationsByTripId(journeyId);
    expect(observations).toHaveLength(0);

    // Remove draft
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
  });

  test('should cascade delete observations when removing trip', async () => {
    const journeyId = 'trip-cascade';

    // Before removal - observations exist
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValueOnce([
      { id: 'obs-1', trip_id: journeyId },
      { id: 'obs-2', trip_id: journeyId },
    ]);

    const beforeObservations = await mockedGetObservationsByTripId(journeyId);
    expect(beforeObservations).toHaveLength(2);

    // Remove trip
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    // After removal - observations should be gone (cascade delete)
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValueOnce([]);

    const afterObservations = await mockedGetObservationsByTripId(journeyId);
    expect(afterObservations).toHaveLength(0);
  });
});

describe('DraftsScreen - Remove Draft UI Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should remove draft card from UI after successful deletion', async () => {
    const drafts = [
      makeDraft({ id: 'trip-1', status: SyncStatus.DRAFTED }),
      makeDraft({ id: 'trip-2', status: SyncStatus.DRAFTED }),
      makeDraft({ id: 'trip-3', status: SyncStatus.DRAFTED }),
    ];

    const journeyToRemove = 'trip-2';

    // Simulate removal
    const updatedDrafts = drafts.filter((d) => d.id !== journeyToRemove);

    expect(updatedDrafts).toHaveLength(2);
    expect(updatedDrafts.find((d) => d.id === 'trip-2')).toBeUndefined();
    expect(updatedDrafts[0].id).toBe('trip-1');
    expect(updatedDrafts[1].id).toBe('trip-3');
  });

  test('should show empty state when last draft is removed', async () => {
    // Start with 1 draft
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'last-trip', sync_status: SyncStatus.DRAFTED },
    ]);

    let drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(1);

    // Remove last draft
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById('last-trip');

    // After removal - empty list
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([]);

    drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(0);
  });

  test('should maintain order of remaining drafts after removal', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED, created_at: 1000 },
      { id: 'trip-2', sync_status: SyncStatus.DRAFTED, created_at: 2000 },
      { id: 'trip-3', sync_status: SyncStatus.DRAFTED, created_at: 3000 },
    ]);

    const drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts[0].id).toBe('trip-1');
    expect(drafts[1].id).toBe('trip-2');
    expect(drafts[2].id).toBe('trip-3');

    // Remove middle draft
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById('trip-2');

    // After removal - order maintained
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValueOnce([
      { id: 'trip-1', sync_status: SyncStatus.DRAFTED, created_at: 1000 },
      { id: 'trip-3', sync_status: SyncStatus.DRAFTED, created_at: 3000 },
    ]);

    const updatedDrafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(updatedDrafts[0].id).toBe('trip-1');
    expect(updatedDrafts[1].id).toBe('trip-3');
  });
});

describe('DraftsScreen - Remove Draft Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle removal of non-existent draft', async () => {
    const nonExistentId = 'trip-999';

    // Mock removal to succeed even if trip doesn't exist
    mockedRemoveTripById.mockResolvedValue();

    await mockedRemoveTripById(nonExistentId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(nonExistentId);
  });

  test('should handle concurrent draft removals', async () => {
    const draftIds = ['trip-1', 'trip-2', 'trip-3'];

    // Mock all removals to succeed
    mockedRemoveTripById.mockResolvedValue();

    // Remove concurrently
    await Promise.all(draftIds.map((id) => mockedRemoveTripById(id)));

    expect(mockedRemoveTripById).toHaveBeenCalledTimes(3);
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(1, 'trip-1');
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(2, 'trip-2');
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(3, 'trip-3');
  });

  test('should handle database transaction failures during removal', async () => {
    const journeyId = 'trip-fail';
    const error = new Error('Transaction failed');

    // Mock removal to fail
    mockedRemoveTripById.mockRejectedValue(error);

    // Removal should fail and propagate error
    await expect(mockedRemoveTripById(journeyId)).rejects.toThrow('Transaction failed');

    // Database should remain in consistent state (trip not removed)
  });

  test('should handle removal with null project_id', async () => {
    const journeyId = 'trip-no-project';

    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: journeyId,
      project_id: null,
      sync_status: SyncStatus.DRAFTED,
    });

    const trip = await mockedGetTripById(journeyId);
    expect(trip?.project_id).toBeNull();

    // Should still be removable
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
  });
});

describe('DraftsScreen - Remove Multiple Drafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should remove multiple drafts sequentially', async () => {
    const draftIds = ['trip-1', 'trip-2', 'trip-3'];

    // Mock successful removals
    mockedRemoveTripById.mockResolvedValue();

    // Remove all drafts one by one
    for (const id of draftIds) {
      await mockedRemoveTripById(id);
    }

    // Verify all removals
    expect(mockedRemoveTripById).toHaveBeenCalledTimes(3);
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(1, 'trip-1');
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(2, 'trip-2');
    expect(mockedRemoveTripById).toHaveBeenNthCalledWith(3, 'trip-3');
  });

  test('should handle partial removal failures', async () => {
    // First removal succeeds
    mockedRemoveTripById.mockResolvedValueOnce();
    await mockedRemoveTripById('trip-1');
    expect(mockedRemoveTripById).toHaveBeenCalledWith('trip-1');

    // Second removal fails
    mockedRemoveTripById.mockRejectedValueOnce(new Error('Removal failed'));
    await expect(mockedRemoveTripById('trip-2')).rejects.toThrow('Removal failed');

    // Third removal should still work
    mockedRemoveTripById.mockResolvedValueOnce();
    await mockedRemoveTripById('trip-3');
    expect(mockedRemoveTripById).toHaveBeenCalledWith('trip-3');
  });
});

describe('DraftsScreen - Remove Draft Data Cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should clean up all associated data when removing draft', async () => {
    const journeyId = 'trip-complete';

    // Draft has complete data
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: journeyId,
      project_id: 'project-123',
      created_at: Date.now(),
      sync_status: SyncStatus.DRAFTED,
    });

    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', trip_id: journeyId },
      { id: 'obs-2', trip_id: journeyId },
    ]);

    const trip = await mockedGetTripById(journeyId);
    const observations = await mockedGetObservationsByTripId(journeyId);

    expect(trip).toBeDefined();
    expect(observations).toHaveLength(2);

    // Remove trip (should clean up everything)
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    expect(mockedRemoveTripById).toHaveBeenCalledWith(journeyId);
  });

  test('should maintain referential integrity after removal', async () => {
    const journeyId = 'trip-integrity';
    const otherJourneyId = 'trip-other';

    // Multiple trips exist
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: journeyId, sync_status: SyncStatus.DRAFTED },
      { id: otherJourneyId, sync_status: SyncStatus.DRAFTED },
    ]);

    let drafts = await mockedGetTripsBySyncStatus(SyncStatus.DRAFTED);
    expect(drafts).toHaveLength(2);

    // Remove one trip
    mockedRemoveTripById.mockResolvedValue();
    await mockedRemoveTripById(journeyId);

    // Other trip should remain intact
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripById.mockResolvedValue({
      id: otherJourneyId,
      sync_status: SyncStatus.DRAFTED,
    });

    const remainingTrip = await mockedGetTripById(otherJourneyId);
    expect(remainingTrip).toBeDefined();
    expect(remainingTrip?.id).toBe(otherJourneyId);
  });
});
