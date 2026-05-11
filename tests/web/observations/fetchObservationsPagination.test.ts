import { fetchObservations } from '../../../apps/web/src/api/observations';
import { supabase } from '../../../apps/web/src/services/supabase';

jest.mock('../../../apps/web/src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('fetchObservations pagination metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps rows and returns hasMore=true when total_count exceeds returned rows', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'obs-1',
          location: null,
          user_id: 'user-1',
          trip_id: 'trip-1',
          created_at: '2026-02-25T18:00:00.000Z',
          observation: 'sample',
          categories: ['Bird'],
          observation_media: [],
          project_id: 'proj-1',
          project_name: 'Project 1',
          project_description: null,
          observer_first_name: 'Jane',
          observer_last_name: 'Doe',
          latitude: 43,
          longitude: -89,
          total_count: 1000,
        },
      ],
      error: null,
    });

    const result = await fetchObservations({
      bounds: {
        ne: [49, -66],
        sw: [24, -125],
      },
      limit: 600,
      offset: 0,
      keywords: '  algae  ',
      userId: 'user-1',
    });

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_filtered_observations',
      expect.objectContaining({
        p_limit: 600,
        p_offset: 0,
        p_keywords: 'algae',
        p_user_id: 'user-1',
      })
    );

    expect(result.observations).toHaveLength(1);
    expect(result.totalCount).toBe(1000);
    expect(result.hasMore).toBe(true);
    expect(result.nextOffset).toBe(1);
  });

  it('parses bigint total_count strings and returns hasMore=false when complete', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'obs-2',
          location: null,
          user_id: 'user-2',
          trip_id: 'trip-2',
          created_at: '2026-02-25T18:00:00.000Z',
          observation: 'sample',
          categories: ['Fish'],
          observation_media: [],
          project_id: 'proj-2',
          project_name: 'Project 2',
          project_description: null,
          observer_first_name: null,
          observer_last_name: null,
          latitude: 44,
          longitude: -90,
          total_count: '1',
        },
      ],
      error: null,
    });

    const result = await fetchObservations({ limit: 1000, offset: 0 });

    expect(result.totalCount).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextOffset).toBeNull();
  });

  it('splits image and video URLs into photos and videos arrays', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'obs-3',
          location: null,
          user_id: 'user-3',
          trip_id: 'trip-3',
          created_at: '2026-02-25T18:00:00.000Z',
          observation: 'sample with media',
          categories: ['Fish'],
          observation_media: [
            'https://example.com/media/photo.jpg',
            'https://example.com/media/clip.mp4',
          ],
          project_id: 'proj-3',
          project_name: 'Project 3',
          project_description: null,
          observer_first_name: 'Sam',
          observer_last_name: 'River',
          latitude: 44,
          longitude: -90,
          total_count: 1,
        },
      ],
      error: null,
    });

    const result = await fetchObservations({ limit: 1000, offset: 0 });

    expect(result.observations[0].photos).toEqual(['https://example.com/media/photo.jpg']);
    expect(result.observations[0].videos).toEqual(['https://example.com/media/clip.mp4']);
  });

  it('returns empty metadata when rpc errors', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await fetchObservations({ limit: 1000, offset: 0 });

    expect(result).toEqual({
      observations: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: null,
      pageSize: 1000,
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
