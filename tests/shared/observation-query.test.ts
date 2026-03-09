import {
  buildObservationRpcArgs,
  deriveHasMore,
  toNullableInt,
  type ObservationPageMeta,
} from '../../packages/shared/src/utils/observation-query';

describe('observation-query shared helpers', () => {
  describe('toNullableInt', () => {
    it('returns null for empty input', () => {
      expect(toNullableInt()).toBeNull();
      expect(toNullableInt('')).toBeNull();
    });

    it('parses valid integer strings', () => {
      expect(toNullableInt('2026')).toBe(2026);
      expect(toNullableInt('02')).toBe(2);
    });

    it('returns null for invalid integer strings', () => {
      expect(toNullableInt('abc')).toBeNull();
    });
  });

  describe('buildObservationRpcArgs', () => {
    it('maps query params to rpc args and trims text fields', () => {
      const args = buildObservationRpcArgs({
        bounds: {
          ne: [49, -66],
          sw: [24, -125],
        },
        types: ['Bird', 'Fish'],
        keywords: '  algae  ',
        projectId: 'project-1',
        myProjectsOnly: true,
        userId: 'user-7',
        since: '2026-02-20T00:00:00.000Z',
        until: '2026-03-01T00:00:00.000Z',
        limit: 1000,
        offset: 500,
      });

      expect(args).toEqual({
        p_min_lat: 24,
        p_min_lng: -125,
        p_max_lat: 49,
        p_max_lng: -66,
        p_year: null,
        p_month: null,
        p_categories: ['Bird', 'Fish'],
        p_keywords: 'algae',
        p_project_id: 'project-1',
        p_my_projects_only: true,
        p_user_id: 'user-7',
        p_since: '2026-02-20T00:00:00.000Z',
        p_until: '2026-03-01T00:00:00.000Z',
        p_limit: 1000,
        p_offset: 500,
      });
    });

    it('normalizes empty filters to null values', () => {
      const args = buildObservationRpcArgs({
        projectId: 'all',
        keywords: '   ',
        types: [],
      });

      expect(args.p_project_id).toBeNull();
      expect(args.p_keywords).toBeNull();
      expect(args.p_categories).toBeNull();
      expect(args.p_user_id).toBeNull();
    });
  });

  describe('deriveHasMore', () => {
    const makeMeta = (overrides: Partial<ObservationPageMeta>): ObservationPageMeta => ({
      requestedLimit: 1000,
      requestedOffset: 0,
      returnedRows: 1000,
      totalCount: 1000,
      ...overrides,
    });

    it('returns false when the last row reaches total count exactly', () => {
      expect(deriveHasMore(makeMeta({ returnedRows: 1000, totalCount: 1000 }))).toBe(false);
    });

    it('returns true when there are more rows beyond the current page', () => {
      expect(deriveHasMore(makeMeta({ returnedRows: 600, totalCount: 1000 }))).toBe(true);
      expect(
        deriveHasMore(makeMeta({ requestedOffset: 1000, returnedRows: 1000, totalCount: 2500 }))
      ).toBe(true);
    });
  });
});
