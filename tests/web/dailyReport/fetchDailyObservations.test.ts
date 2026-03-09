import { fetchDailyObservations } from '../../../apps/web/src/api/observations';
import { supabase } from '../../../apps/web/src/services/supabase';

jest.mock('../../../apps/web/src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('fetchDailyObservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-25T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queries get_filtered_observations since 24 hours ago', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await fetchDailyObservations();

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_filtered_observations',
      expect.objectContaining({
        p_since: expect.stringMatching(/^2026-02-24T12:00:00/),
      })
    );
  });

  it('passes through an admin user filter when provided', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await fetchDailyObservations({ userId: 'admin-filter-user' });

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_filtered_observations',
      expect.objectContaining({
        p_user_id: 'admin-filter-user',
      })
    );
  });

  it('maps rpc rows to observations', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'obs-1',
          location: null,
          user_id: 'user-1',
          trip_id: 'trip-1',
          created_at: '2026-02-25T10:30:00.000Z',
          observation: 'Test observation',
          categories: ['Wildlife', 'Birds'],
          observation_media: ['photo1.jpg'],
          project_id: 'project-1',
          project_name: 'Test Project',
          project_description: null,
          observer_first_name: 'John',
          observer_last_name: 'Doe',
          latitude: 43,
          longitude: -89,
          total_count: 1,
        },
      ],
      error: null,
    });

    const result = await fetchDailyObservations();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'obs-1',
      projectName: 'Test Project',
      observation: 'Test observation',
      observerName: 'John Doe',
      userId: 'user-1',
      photos: ['photo1.jpg'],
      type: 'Wildlife',
      keywords: ['Wildlife', 'Birds'],
      videos: [],
    });
  });
});
