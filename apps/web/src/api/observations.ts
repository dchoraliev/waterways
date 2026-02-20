// apps/web/src/api/observations.ts
import { supabase } from '../services/supabase';
import type { Observation } from '../types/observation';

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

  trips: {
    id: string;
    start_time: string | null;
    start_location: string | null;
    project_id: string | null;
    projects: {
      id: string;
      name: string;
      description: string | null;
    } | null;
  } | null;

  users: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
};

/**
 * Fetch observations from Supabase and convert them
 * into the Observation shape used by the dashboard.
 */
export async function fetchObservations(): Promise<Observation[]> {
  const { data, error } = await supabase.from('observations').select(`
      id,
      location,
      user_id,
      trip_id,
      created_at,
      observation,
      categories,
      observation_media,
      trips (
        id,
        start_time,
        start_location,
        project_id,
        projects (
          id,
          name,
          description
        )
      ),
      users (
        first_name,
        last_name,
        email
      )
    `);

  if (error) {
    console.error('Error fetching observations:', error);
    return [];
  }

  return (data ?? []).map((row): Observation => {
    const r = row as unknown as ObservationRow;

    const { lat, lng } = parseEwkbPoint(r.location);

    const projectName = r.trips?.projects?.name ?? 'Untitled Project';

    const observerName = r.users
      ? `${r.users.first_name ?? ''} ${r.users.last_name ?? ''}`.trim() || r.users.email
      : 'Unknown Observer';

    const createdRaw = r.created_at ?? '';

    // Derive date and time from the user's local timezone, not the UTC slice
    let date = '';
    let timestamp = '';
    if (createdRaw) {
      const created = new Date(createdRaw);
      // Local date in YYYY-MM-DD format
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

    const categories = Array.isArray(r.categories) ? r.categories : [];
    const media = Array.isArray(r.observation_media) ? r.observation_media : [];

    const photos: string[] = media;
    const videos: string[] = [];

    return {
      id: r.id,
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
      observation: r.observation ?? '',
      observerName,
      userId: r.user_id ?? '',
      photos,
      videos,
      type: categories[0] ?? 'Observation',
      keywords: categories,
    };
  });
}

/**
 * Fetch observations from the last 24 hours from Supabase.
 * Returns observations sorted by creation time (most recent first).
 */
export async function fetchDailyObservations(): Promise<Observation[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayAgoISO = oneDayAgo.toISOString();

  const { data, error } = await supabase
    .from('observations')
    .select(
      `
      id,
      location,
      user_id,
      trip_id,
      created_at,
      observation,
      categories,
      observation_media,
      trips (
        id,
        start_time,
        start_location,
        project_id,
        projects (
          id,
          name,
          description
        )
      ),
      users (
        first_name,
        last_name,
        email
      )
    `
    )
    .gte('created_at', oneDayAgoISO)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching daily observations:', error);
    return [];
  }

  return (data ?? []).map((row): Observation => {
    const r = row as unknown as ObservationRow;

    const { lat, lng } = parseEwkbPoint(r.location);

    const projectName = r.trips?.projects?.name ?? 'Untitled Project';

    const observerName = r.users
      ? `${r.users.first_name ?? ''} ${r.users.last_name ?? ''}`.trim() || r.users.email
      : 'Unknown Observer';

    const createdRaw = r.created_at ?? '';

    // Derive date and time from the user's local timezone, not the UTC slice
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

    const categories = Array.isArray(r.categories) ? r.categories : [];
    const media = Array.isArray(r.observation_media) ? r.observation_media : [];

    const photos: string[] = media;
    const videos: string[] = [];

    return {
      id: r.id,
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
      observation: r.observation ?? '',
      observerName,
      userId: r.user_id ?? '',
      photos,
      videos,
      type: categories[0] ?? 'Observation',
      keywords: categories,
    };
  });
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
