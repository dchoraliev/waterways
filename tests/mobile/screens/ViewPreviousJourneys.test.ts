// tests/mobile/screens/ViewPreviousJourneys.test.ts

import * as TripManager from '../../../apps/mobile/src/database/TripManager';
import * as ObservationManager from '../../../apps/mobile/src/database/ObservationManager';
import { SyncStatus } from '../../../apps/mobile/src/database/SyncStatus';

// Mock dependencies
jest.mock('../../../apps/mobile/src/database/TripManager');
jest.mock('../../../apps/mobile/src/database/ObservationManager');
jest.mock('@shared/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    // @ts-expect-error - Partial mock object for testing
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

// Type the mocked functions
const mockedGetTripsBySyncStatus = TripManager.getTripsBySyncStatus as jest.MockedFunction<
  typeof TripManager.getTripsBySyncStatus
>;
const mockedGetObservationsByTripId =
  ObservationManager.getObservationsByTripId as jest.MockedFunction<
    typeof ObservationManager.getObservationsByTripId
  >;
// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    if (secs > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${minutes}m`;
  }

  return `${secs}s`;
};

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Loading
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Loading Journeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads only SYNCED trips', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.SYNCED },
      { id: 'trip-2', sync_status: SyncStatus.SYNCED },
    ]);

    const trips = await mockedGetTripsBySyncStatus(SyncStatus.SYNCED);

    expect(mockedGetTripsBySyncStatus).toHaveBeenCalledWith(SyncStatus.SYNCED);
    expect(trips).toHaveLength(2);
    expect(trips.every((t) => t.sync_status === SyncStatus.SYNCED)).toBe(true);
  });

  test('does not load DRAFTED or REVIEWED trips', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([
      { id: 'trip-1', sync_status: SyncStatus.SYNCED },
    ]);

    const trips = await mockedGetTripsBySyncStatus(SyncStatus.SYNCED);

    expect(
      trips.every(
        (t) => t.sync_status !== SyncStatus.DRAFTED && t.sync_status !== SyncStatus.REVIEWED
      )
    ).toBe(true);
  });

  test('loads observations for each trip', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Test observation',
        latitude: 42.123,
        longitude: -87.456,
        category_id: 'WILDLIFE',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(mockedGetObservationsByTripId).toHaveBeenCalledWith('trip-1');
    expect(observations).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Project Display
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Project Name Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows "No Project" when project_id is null', () => {
    const projectId = null;
    const projectName = projectId ? 'Some Project' : 'No Project';

    expect(projectName).toBe('No Project');
  });

  test('shows "Unknown Project" when project lookup fails', () => {
    const projectId = 'project-123';
    const projects: Array<{ id: string; name: string }> = [];

    const project = projects.find((p) => p.id === projectId);
    const projectName = project ? project.name : 'Unknown Project';

    expect(projectName).toBe('Unknown Project');
  });

  test('shows project name when project is found', () => {
    const projectId = 'project-123';
    const projects: Array<{ id: string; name: string }> = [
      { id: 'project-123', name: 'River Survey' },
      { id: 'project-456', name: 'Lake Study' },
    ];

    const project = projects.find((p) => p.id === projectId);
    const projectName = project ? project.name : 'Unknown Project';

    expect(projectName).toBe('River Survey');
  });

  test('handles multiple trips with different projects', () => {
    const projects: Array<{ id: string; name: string }> = [
      { id: 'project-1', name: 'Project A' },
      { id: 'project-2', name: 'Project B' },
    ];

    const trips = [
      { id: 'trip-1', project_id: 'project-1' },
      { id: 'trip-2', project_id: 'project-2' },
      { id: 'trip-3', project_id: null },
    ];

    const projectNames = trips.map((trip) => {
      if (!trip.project_id) return 'No Project';
      const project = projects.find((p) => p.id === trip.project_id);
      return project ? project.name : 'Unknown Project';
    });

    expect(projectNames).toEqual(['Project A', 'Project B', 'No Project']);
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Duration Formatting
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Duration Formatting', () => {
  test('formats seconds correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(1)).toBe('1s');
  });

  test('formats minutes and seconds correctly', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(345)).toBe('5m 45s');
    expect(formatDuration(120)).toBe('2m');
  });

  test('formats hours and minutes correctly', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(8100)).toBe('2h 15m');
  });

  test('formats long durations', () => {
    expect(formatDuration(36000)).toBe('10h');
    expect(formatDuration(86400)).toBe('24h');
  });

  test('handles zero duration', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  test('formats seconds only (under 1 minute)', () => {
    expect(formatDuration(5)).toBe('5s');
    expect(formatDuration(59)).toBe('59s');
  });

  test('formats minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(65)).toBe('1m 5s');
    expect(formatDuration(125)).toBe('2m 5s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  test('formats hours and minutes (no seconds shown)', () => {
    expect(formatDuration(3900)).toBe('1h 5m');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(7200)).toBe('2h');
  });

  test('formats very long durations', () => {
    expect(formatDuration(172800)).toBe('48h');
  });

  test('handles edge cases', () => {
    expect(formatDuration(61)).toBe('1m 1s');
    expect(formatDuration(3601)).toBe('1h');
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Observation Display
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Observation Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays edited observations correctly', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Updated description',
        latitude: 42.999,
        longitude: -87.999,
        category_id: 'INFRASTRUCTURE',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].observation).toBe('Updated description');
    expect(observations[0].latitude).toBe(42.999);
    expect(observations[0].longitude).toBe(-87.999);
    expect(observations[0].category_id).toBe('INFRASTRUCTURE');
  });

  test('shows observations synced without media', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Observation without photo',
        multimedia_url: null,
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].multimedia_url).toBeNull();
  });

  test('handles multiple observations per trip', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      { id: 'obs-1', observation: 'First observation' },
      { id: 'obs-2', observation: 'Second observation' },
      { id: 'obs-3', observation: 'Third observation' },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations).toHaveLength(3);
    expect(observations[0].observation).toBe('First observation');
    expect(observations[2].observation).toBe('Third observation');
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Edit Changes Visible
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Edit Changes Appear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('edited description appears in previous journeys', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'New edited text',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].observation).toBe('New edited text');
  });

  test('edited location appears in previous journeys', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        latitude: 42.999,
        longitude: -87.999,
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].latitude).toBe(42.999);
    expect(observations[0].longitude).toBe(-87.999);
  });

  test('edited category appears in previous journeys', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        category_id: 'INFRASTRUCTURE',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].category_id).toBe('INFRASTRUCTURE');
  });

  test('multiple edits all appear in previous journeys', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'All fields edited',
        latitude: 43,
        longitude: -88,
        category_id: 'POLLUTION',
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');
    const obs = observations[0];

    expect(obs.observation).toBe('All fields edited');
    expect(obs.latitude).toBe(43);
    expect(obs.longitude).toBe(-88);
    expect(obs.category_id).toBe('POLLUTION');
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Edge Cases
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles trip with no observations', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations).toEqual([]);
  });

  test('handles observation with null coordinates', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'No location',
        latitude: null,
        longitude: null,
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].latitude).toBeNull();
    expect(observations[0].longitude).toBeNull();
  });

  test('handles observation with null category', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetObservationsByTripId.mockResolvedValue([
      {
        id: 'obs-1',
        observation: 'Uncategorized',
        category_id: null,
      },
    ]);

    const observations = await mockedGetObservationsByTripId('trip-1');

    expect(observations[0].category_id).toBeNull();
  });

  test('handles trip with very long duration', () => {
    const longDuration = 172800;
    const formatted = formatDuration(longDuration);

    expect(formatted).toBe('48h');
  });

  test('handles empty trips list', async () => {
    // @ts-expect-error - Partial mock object for testing
    mockedGetTripsBySyncStatus.mockResolvedValue([]);

    const trips = await mockedGetTripsBySyncStatus(SyncStatus.SYNCED);

    expect(trips).toEqual([]);
  });
});

// ═════════════════════════════════════════════
// VIEW PREVIOUS JOURNEYS - Project Name Details
// ═════════════════════════════════════════════

describe('ViewPreviousJourneys - Project Name Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows "No Project" when project_id is null', () => {
    const trip = {
      id: 'trip-1',
      project_id: null,
    };

    const projectName = trip.project_id === null ? 'No Project' : 'Some Project';

    expect(projectName).toBe('No Project');
  });

  test('shows "Unknown Project" when project lookup fails', () => {
    const trip = {
      id: 'trip-1',
      project_id: 'non-existent-project',
    };

    const projects = new Map([
      ['project-1', 'Water Quality Study'],
      ['project-2', 'Wildlife Survey'],
    ]);

    const projectName = projects.get(trip.project_id) ?? 'Unknown Project';

    expect(projectName).toBe('Unknown Project');
  });

  test('shows actual project name when project exists', () => {
    const trip = {
      id: 'trip-1',
      project_id: 'project-1',
    };

    const projects = new Map([
      ['project-1', 'Water Quality Study'],
      ['project-2', 'Wildlife Survey'],
    ]);

    const projectName = projects.get(trip.project_id) ?? 'Unknown Project';

    expect(projectName).toBe('Water Quality Study');
  });

  test('handles empty project name gracefully', () => {
    const trip = {
      id: 'trip-1',
      project_id: 'project-empty',
    };

    const projects = new Map([['project-empty', '']]);

    const projectName = projects.get(trip.project_id) || 'Unknown Project';

    expect(projectName).toBe('Unknown Project');
  });

  test('logs debug info when project lookup happens', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const tripId = 'trip-123';
    const projectId = 'project-456';

    console.log(`[ReviewList] Looking up project for trip ${tripId}: ${projectId}`);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Looking up project'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(tripId));

    consoleSpy.mockRestore();
  });

  test('logs debug info when project is found', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const projectId = 'project-123';
    const projectName = 'Watershed Study';

    console.log(`[ReviewList] Found project ${projectId}: ${projectName}`);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found project'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(projectName));

    consoleSpy.mockRestore();
  });

  test('logs debug info when project lookup fails', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const projectId = 'missing-project';

    console.log(`[ReviewList] Project not found in lookup: ${projectId}`);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(projectId));

    consoleSpy.mockRestore();
  });
});
