import { fetchDailyObservations } from '../../../apps/web/src/api/observations';
import { supabase } from '../../../apps/web/src/services/supabase';

// Mock Supabase client
jest.mock('../../../apps/web/src/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('fetchDailyObservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-04T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockObservationRow = (overrides = {}) => ({
    id: 'obs-123',
    location: null,
    user_id: 'user-456',
    trip_id: 'trip-789',
    created_at: '2026-02-04T10:30:00.000Z',
    observation: 'Test observation text',
    categories: ['Wildlife', 'Birds'],
    observation_media: ['photo1.jpg'],
    trips: {
      id: 'trip-789',
      start_time: '2026-02-04T09:00:00.000Z',
      start_location: 'River Start',
      project_id: 'proj-111',
      projects: {
        id: 'proj-111',
        name: 'Test Project',
        description: 'A test project',
      },
    },
    users: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    ...overrides,
  });

  it('should fetch observations from the last 24 hours', async () => {
    const mockData = [createMockObservationRow()];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(supabase.from).toHaveBeenCalledWith('observations');
    expect(mockQuery.gte).toHaveBeenCalledWith(
      'created_at',
      expect.stringMatching(/^2026-02-03T12:00:00/)
    );
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('obs-123');
  });

  it('should transform observation data correctly', async () => {
    const mockData = [createMockObservationRow()];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    const createdAt = '2026-02-04T10:30:00.000Z';
    const createdLocal = new Date(createdAt);
    const expectedDate = [
      createdLocal.getFullYear(),
      String(createdLocal.getMonth() + 1).padStart(2, '0'),
      String(createdLocal.getDate()).padStart(2, '0'),
    ].join('-');
    const expectedTimestamp = createdLocal.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    expect(result[0]).toMatchObject({
      id: 'obs-123',
      createdAt,
      projectName: 'Test Project',
      timestamp: expectedTimestamp,
      date: expectedDate,
      observation: 'Test observation text',
      observerName: 'John Doe',
      userId: 'user-456',
      type: 'Wildlife',
      keywords: ['Wildlife', 'Birds'],
      photos: ['photo1.jpg'],
      videos: [],
    });
  });

  it('should handle missing user name gracefully', async () => {
    const mockData = [
      createMockObservationRow({
        users: {
          first_name: null,
          last_name: null,
          email: 'anonymous@example.com',
        },
      }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result[0].observerName).toBe('anonymous@example.com');
  });

  it('should handle missing user entirely', async () => {
    const mockData = [
      createMockObservationRow({
        users: null,
      }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result[0].observerName).toBe('Unknown Observer');
  });

  it('should handle missing project name', async () => {
    const mockData = [
      createMockObservationRow({
        trips: {
          id: 'trip-789',
          start_time: null,
          start_location: null,
          project_id: null,
          projects: null,
        },
      }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result[0].projectName).toBe('Untitled Project');
  });

  it('should handle empty categories array', async () => {
    const mockData = [
      createMockObservationRow({
        categories: [],
      }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result[0].type).toBe('Observation');
    expect(result[0].keywords).toEqual([]);
  });

  it('should handle null categories', async () => {
    const mockData = [
      createMockObservationRow({
        categories: null,
      }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result[0].type).toBe('Observation');
    expect(result[0].keywords).toEqual([]);
  });

  it('should return empty array on error', async () => {
    const mockError = { message: 'Database connection failed' };

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await fetchDailyObservations();

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching daily observations:', mockError);

    consoleSpy.mockRestore();
  });

  it('should return empty array when no data', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result).toEqual([]);
  });

  it('should handle multiple observations', async () => {
    const mockData = [
      createMockObservationRow({ id: 'obs-1', created_at: '2026-02-04T11:00:00.000Z' }),
      createMockObservationRow({ id: 'obs-2', created_at: '2026-02-04T10:00:00.000Z' }),
      createMockObservationRow({ id: 'obs-3', created_at: '2026-02-04T09:00:00.000Z' }),
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };

    (supabase.from as jest.Mock).mockReturnValue(mockQuery);

    const result = await fetchDailyObservations();

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('obs-1');
    expect(result[1].id).toBe('obs-2');
    expect(result[2].id).toBe('obs-3');
  });
});
