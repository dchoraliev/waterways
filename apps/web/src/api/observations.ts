// apps/web/src/api/observations.ts
import { supabase } from '../services/supabase';
import type { Observation } from '../types/observation';
import {
  buildObservationRpcArgs,
  deriveHasMore,
  type ObservationQueryParams,
  type ObservationBounds,
} from '@waterways/shared';

export type { ObservationQueryParams, ObservationBounds };

export interface ObservationYearsQueryParams {
  projectId?: string;
  myProjectsOnly?: boolean;
}

// EWKB geography(POINT) comes back from Supabase as a hex string like:
// "0101000020E6100000BE9F1A2FDD6856C0A089B0E1E95D4540"
// This function parses that into { lat, lng }.
function parseEwkbPoint(ewkb: string | null | unknown): { lat: number; lng: number } {
  if (!ewkb || typeof ewkb !== 'string') {
    return { lat: 0, lng: 0 };
  }

  try {
    const hex = ewkb.trim();
    if (hex.length < 2 + 8 + 16) {
      return { lat: 0, lng: 0 };
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    const view = new DataView(bytes.buffer);

    // Byte 0 is the endian flag: 1 = little endian, 0 = big endian
    const littleEndian = view.getUint8(0) === 1;

    // Next 4 bytes: type + flags (EWKB)
    const type = view.getUint32(1, littleEndian);

    // If the SRID flag (0x20000000) is set, there is a 4-byte SRID after the type
    const SRID_FLAG = 0x20000000;
    let offset = 1 + 4; // byte order + type
    const hasSrid = (type & SRID_FLAG) === SRID_FLAG;
    if (hasSrid) {
      offset += 4; // skip SRID
    }

    const x = view.getFloat64(offset, littleEndian); // longitude
    const y = view.getFloat64(offset + 8, littleEndian); // latitude

    return { lat: y, lng: x };
  } catch (err) {
    console.error('Failed to parse EWKB point:', ewkb, err);
    return { lat: 0, lng: 0 };
  }
}

// Shape of the row from Supabase for observations + joins
type ObservationRow = {
  id: string;
  location: string | null; // EWKB geography hex string
  user_id: string | null;
  trip_id: string | null;
  created_at: string;
  observation: string | null;
  categories: string[] | null;
  observation_media: string[] | null;
  project_id: string | null;
  project_name: string | null;
  project_description: string | null;
  observer_first_name: string | null;
  observer_last_name: string | null;
  latitude: number | null;
  longitude: number | null;
  total_count?: number | string | null;
};

export interface FetchObservationsResult {
  observations: Observation[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
  pageSize: number;
}

function mapRowToObservation(row: ObservationRow): Observation {
  let lat = row.latitude ?? 0;
  let lng = row.longitude ?? 0;

  if ((row.latitude == null || row.longitude == null) && row.location) {
    const parsed = parseEwkbPoint(row.location);
    lat = parsed.lat;
    lng = parsed.lng;
  }

  const projectName = row.project_name ?? 'Untitled Project';

  let observerName = 'Anonymous';
  if (row.observer_first_name || row.observer_last_name) {
    observerName = `${row.observer_first_name ?? ''} ${row.observer_last_name ?? ''}`.trim();
    if (!observerName) observerName = 'Anonymous';
  } else if (!row.user_id) {
    observerName = 'Deleted User';
  }

  const createdRaw = row.created_at ?? '';

  let date = '';
  let timestamp = '';
  if (createdRaw) {
    const created = new Date(createdRaw);
    date = [
      created.getFullYear(),
      String(created.getMonth() + 1).padStart(2, '0'),
      String(created.getDate()).padStart(2, '0'),
    ].join('-');
    timestamp = created.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const categories = Array.isArray(row.categories) ? row.categories : [];
  const media = Array.isArray(row.observation_media) ? row.observation_media : [];

  return {
    id: row.id,
    projectName,
    journeyStartLocation: projectName || 'Trip start',
    location: {
      lat,
      lng,
      name: 'Observation location',
    },
    createdAt: createdRaw,
    timestamp,
    date,
    observation: row.observation ?? '',
    observerName,
    userId: row.user_id ?? '',
    photos: media,
    videos: [],
    type: categories[0] ?? 'Observation',
    keywords: categories,
  };
}

/**
 * Fetch observations from Supabase and convert them
 * into the Observation shape used by the dashboard.
 */
export async function fetchObservations(
  params: ObservationQueryParams = {}
): Promise<FetchObservationsResult> {
  const rpcArgs = buildObservationRpcArgs(params);
  const requestedOffset = params.offset ?? 0;
  const requestedLimit = params.limit ?? 2000;

  if (typeof supabase.rpc !== 'function') {
    console.error('Supabase RPC client is unavailable for fetchObservations');
    return {
      observations: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: null,
      pageSize: requestedLimit,
    };
  }

  const { data, error } = await supabase.rpc(
    'get_filtered_observations',
    rpcArgs as unknown as Record<string, string | number | boolean | string[] | null>
  );

  if (error) {
    console.error('Error fetching observations:', error);
    return {
      observations: [],
      totalCount: 0,
      hasMore: false,
      nextOffset: null,
      pageSize: requestedLimit,
    };
  }

  const rows = data ?? [];
  const observations = rows.map(mapRowToObservation);
  const totalCountRaw = rows[0]?.total_count;
  const parsedTotalFromString =
    typeof totalCountRaw === 'string' ? Number.parseInt(totalCountRaw, 10) : Number.NaN;
  const totalCount =
    typeof totalCountRaw === 'number'
      ? totalCountRaw
      : Number.isFinite(parsedTotalFromString)
        ? parsedTotalFromString
        : observations.length;
  const hasMore = deriveHasMore({
    requestedLimit,
    requestedOffset,
    returnedRows: observations.length,
    totalCount,
  });

  return {
    observations,
    totalCount,
    hasMore,
    nextOffset: hasMore ? requestedOffset + observations.length : null,
    pageSize: requestedLimit,
  };
}

/**
 * Fetch observations from the last 24 hours from Supabase.
 * Returns observations sorted by creation time (most recent first).
 */
export async function fetchDailyObservations(): Promise<Observation[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoISO = oneDayAgo.toISOString();

  const result = await fetchObservations({ since: oneDayAgoISO });
  return result.observations;
}

export async function fetchObservationCategories(): Promise<
  Array<{
    id: number;
    type: string;
    color: string | null;
    keywords: string[] | null;
    is_fallback: boolean;
    is_active: boolean;
  }>
> {
  const { data, error } = await supabase
    .from('observation_categories')
    .select('id, type, color, keywords, is_fallback, is_active')
    .order('type');

  if (error) {
    console.error('Error fetching observation categories:', error);
    return [];
  }

  console.log('Raw category data from database:', data);

  // Process the data to ensure keywords are properly parsed
  const processedData = (data || []).map((category) => ({
    ...category,
    keywords: (() => {
      if (!category.keywords) return null;
      if (Array.isArray(category.keywords)) return category.keywords;

      // If keywords is a string, try to parse it as JSON
      if (typeof category.keywords === 'string') {
        try {
          const parsed = JSON.parse(category.keywords);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          // If not valid JSON, split by comma
          return (category.keywords as string)
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
        }
      }
      return null;
    })(),
  }));

  console.log('Processed category data:', processedData);
  return processedData;
}

export async function fetchObservationTypes(): Promise<string[]> {
  const uniqueTypes = new Set<string>();

  const addType = (value: unknown) => {
    if (typeof value !== 'string') {
      return;
    }

    const normalized = value.trim();
    if (normalized) {
      uniqueTypes.add(normalized);
    }
  };

  const addTypesFromCategories = (categories: unknown) => {
    if (!Array.isArray(categories)) {
      return;
    }

    for (const category of categories) {
      addType(category);
    }
  };

  try {
    if (typeof supabase.rpc === 'function') {
      const { data, error } = await supabase.rpc('get_observation_types');

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (typeof row === 'string') {
            addType(row);
            continue;
          }

          if (row && typeof row === 'object' && 'type' in row) {
            addType((row as { type?: unknown }).type);
          }
        }
      }
    }
  } catch (error) {
    console.warn(
      'get_observation_types RPC unavailable, falling back to direct observation scan:',
      error
    );
  }

  if (uniqueTypes.size === 0) {
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('observations')
        .select('categories')
        .range(from, to);

      if (error) {
        console.error('Error fetching observation categories from observations:', error);
        break;
      }

      const rows = data ?? [];

      for (const row of rows) {
        addTypesFromCategories((row as { categories?: unknown }).categories);
      }

      if (rows.length < pageSize) {
        break;
      }

      from += pageSize;
    }
  }

  if (uniqueTypes.size === 0) {
    const { data, error } = await supabase
      .from('observation_categories')
      .select('type, is_active')
      .or('is_active.eq.true,is_active.is.null')
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching observation categories:', error);
      return [];
    }

    for (const row of data ?? []) {
      if (!row || typeof row.type !== 'string') {
        continue;
      }

      addType(row.type);
    }
  }

  return [...uniqueTypes].sort((a, b) => a.localeCompare(b));
}

export async function fetchObservationYears(
  params: ObservationYearsQueryParams = {}
): Promise<string[]> {
  if (typeof supabase.rpc !== 'function') {
    console.error('Supabase RPC client is unavailable for fetchObservationYears');
    return [];
  }

  const { data, error } = await supabase.rpc('get_observation_years', {
    p_project_id: params.projectId && params.projectId !== 'all' ? params.projectId : undefined,
    p_my_projects_only: params.myProjectsOnly ?? false,
  });

  if (error) {
    console.error('Error fetching observation years:', error);
    return [];
  }

  return (data ?? [])
    .map((row) => row.year)
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => b - a)
    .map((value) => String(value));
}

/**
 * Delete a single observation from Supabase by ID.
 */
export type DeleteResult = { success: boolean; error?: string; data?: unknown };

export async function deleteObservation(observationId: string): Promise<DeleteResult> {
  const { error, data } = await supabase
    .from('observations')
    .delete()
    .select('*')
    .eq('id', observationId);

  if (error) {
    console.error('Error deleting observation:', error);
    return { success: false, error: error.message, data };
  }

  return { success: true, data };
}

/**
 * Delete all observations by a specific user from Supabase.
 */
export async function deleteAllUserObservations(userId: string): Promise<DeleteResult> {
  const { error, data } = await supabase
    .from('observations')
    .delete()
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting user observations:', error);
    return { success: false, error: error.message, data };
  }

  return { success: true, data };
}
