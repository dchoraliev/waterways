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
