export interface ObservationBounds {
  ne: [number, number];
  sw: [number, number];
}

export interface ObservationQueryParams {
  bounds?: ObservationBounds | null;
  year?: string;
  month?: string;
  types?: string[];
  keywords?: string;
  projectId?: string;
  myProjectsOnly?: boolean;
  userId?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}

export interface ObservationRpcArgs {
  p_min_lat: number | null;
  p_min_lng: number | null;
  p_max_lat: number | null;
  p_max_lng: number | null;
  p_year: number | null;
  p_month: number | null;
  p_categories: string[] | null;
  p_keywords: string | null;
  p_project_id: string | null;
  p_my_projects_only: boolean;
  p_user_id: string | null;
  p_since: string | null;
  p_until: string | null;
  p_limit: number | null;
  p_offset: number | null;
}

export function toNullableInt(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function buildObservationRpcArgs(params: ObservationQueryParams = {}): ObservationRpcArgs {
  return {
    p_min_lat: params.bounds?.sw?.[0] ?? null,
    p_min_lng: params.bounds?.sw?.[1] ?? null,
    p_max_lat: params.bounds?.ne?.[0] ?? null,
    p_max_lng: params.bounds?.ne?.[1] ?? null,
    p_year: toNullableInt(params.year),
    p_month: toNullableInt(params.month),
    p_categories: params.types && params.types.length > 0 ? params.types : null,
    p_keywords: params.keywords?.trim() ? params.keywords.trim() : null,
    p_project_id: params.projectId && params.projectId !== 'all' ? params.projectId : null,
    p_my_projects_only: params.myProjectsOnly ?? false,
    p_user_id: params.userId?.trim() ? params.userId.trim() : null,
    p_since: params.since ?? null,
    p_until: params.until ?? null,
    p_limit: params.limit ?? null,
    p_offset: params.offset ?? null,
  };
}

export interface ObservationPageMeta {
  requestedLimit: number;
  requestedOffset: number;
  returnedRows: number;
  totalCount: number;
}

export function deriveHasMore(meta: ObservationPageMeta): boolean {
  return meta.requestedOffset + meta.returnedRows < meta.totalCount;
}
