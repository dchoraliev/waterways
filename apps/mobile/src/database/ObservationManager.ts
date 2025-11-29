/**
 * Observation Manager - Manages observation CRUD operations
 *
 * Handles storage and retrieval of survey observations:
 * - Single observation records from waterway surveys
 * - Location data (latitude/longitude) of observation points
 * - Associated media (photos, audio recordings)
 * - Transcribed text from audio recordings
 * - Observation categories and notes
 * - Sync tracking for offline-first architecture
 *
 * All functions use parameterized queries for SQL injection prevention.
 * Boolean values (audio_transcribed) are stored as 0/1 integers in SQLite.
 */

import { getDatabase } from "./db";
import { Observation } from "@waterways/shared/src/models/local-db-rows";

/**
 * UUID v4 generator (RFC 4122 compliant)
 *
 * Generates cryptographically suitable random UUIDs without external dependencies.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @returns string - A valid UUID v4 identifier
 * @private Internal use only
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create and insert a new observation record.
 *
 * Creates an observation for a specific trip. Automatically generates:
 * - UUID for the observation
 * - Created timestamp
 * - Sync status ('pending' by default)
 *
 * @param params - Observation creation parameters
 *   - user_id: Required - the user making the observation
 *   - trip_id: Required - the survey trip this observation belongs to
 *   - latitude: Optional - observation location latitude (defaults to null)
 *   - longitude: Optional - observation location longitude (defaults to null)
 *   - observation: Optional - text description/notes (defaults to null)
 *   - category_id: Optional - observation category (defaults to null)
 *   - direction: Optional - viewing direction or compass heading (defaults to null)
 *   - audio_media_id: Optional - UUID of audio recording (defaults to null)
 *   - audio_transcribed: Optional - whether audio has been transcribed (defaults to false)
 *   - local_media_id: Optional - local media file reference (defaults to null)
 *   - multimedia_url: Optional - remote URL for synced multimedia (defaults to null)
 *   - sync_status: Optional - sync state, defaults to 'pending'
 *
 * @returns Promise<string> - The generated UUID of the new observation
 *
 * @throws If database operation fails
 *
 * Usage:
 *   const obsId = await createObservation({
 *     user_id: 'user-123',
 *     trip_id: 'trip-456',
 *     latitude: 43.2143,
 *     longitude: -89.7865,
 *     observation: 'Algae bloom observed',
 *     category_id: 'algae',
 *     direction: 'NE'
 *   });
 *   console.log(`Created observation: ${obsId}`);
 */
export async function createObservation(params: {
  user_id: string;
  trip_id: string;
  latitude?: number | null;
  longitude?: number | null;
  observation?: string | null;
  category_id?: string | null;
  direction?: string | null;
  audio_media_id?: string | null;
  audio_transcribed?: boolean;
  local_media_id?: string | null;
  multimedia_url?: string | null;
  sync_status?: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateUUID();
  const now = Date.now();
  const sync_status = params.sync_status ?? 'pending';
  const last_synced_at = 0;

  await db!.runAsync(
    `INSERT INTO observations (
      id, user_id, trip_id, latitude, longitude, created_at,
      audio_media_id, audio_transcribed, observation, category_id, direction, local_media_id,
      sync_status, multimedia_url, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.user_id,
      params.trip_id,
      params.latitude ?? null,
      params.longitude ?? null,
      now,
      params.audio_media_id ?? null,
      (params.audio_transcribed ?? false) ? 1 : 0,
      params.observation ?? null,
      params.category_id ?? null,
      params.direction ?? null,
      params.local_media_id ?? null,
      sync_status,
      params.multimedia_url ?? null,
      last_synced_at,
    ]
  );

  return id;
}

/**
 * Retrieve a single observation record by id.
 *
 * @param id - Observation record UUID
 *
 * @returns Promise<Observation | null> - The observation record, or null if not found
 *
 * Usage:
 *   const obs = await getObservationById('obs-uuid-123');
 *   if (obs) {
 *     console.log(`Observation: ${obs.observation} at (${obs.latitude}, ${obs.longitude})`);
 *   }
 */
export async function getObservationById(id: string): Promise<Observation | null> {
  const db = await getDatabase();
  const rows = await db!.getAllAsync<Observation>(
    `SELECT * FROM observations WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows && rows.length ? rows[0] : null;
}

/**
 * Update specific fields on an observation record by id.
 *
 * Uses a whitelist of allowed fields to prevent accidental overwrites of immutable data.
 * Only provided fields in the updates object are modified; other fields remain unchanged.
 * Boolean values (audio_transcribed) are automatically converted to 0/1 integers.
 *
 * Allowed fields (cannot update id, user_id, trip_id, created_at):
 * - latitude - observation location latitude
 * - longitude - observation location longitude
 * - observation - text notes/description
 * - category_id - observation category
 * - direction - viewing direction or compass heading
 * - audio_media_id - UUID of associated audio recording
 * - audio_transcribed - whether audio has been transcribed (automatically converted to 0/1)
 * - local_media_id - local media file reference
 * - multimedia_url - remote URL for synced multimedia
 * - sync_status - upload/sync state
 * - last_synced_at - last sync timestamp
 *
 * @param id - Observation record UUID to update
 * @param updates - Partial object with only the fields to update
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   await updateObservationById('obs-uuid-123', {
 *     observation: 'Updated description',
 *     audio_transcribed: true,
 *     sync_status: 'synced',
 *     last_synced_at: Date.now()
 *   });
 */
export async function updateObservationById(
  id: string,
  updates: Partial<Pick<Observation, 'latitude' | 'longitude' | 'observation' | 'category_id' | 'direction' | 'audio_media_id' | 'audio_transcribed' | 'local_media_id' | 'multimedia_url' | 'sync_status' | 'last_synced_at'>>
): Promise<void> {
  const db = await getDatabase();
  const allowedKeys: Array<keyof Observation> = [
    'latitude', 'longitude', 'observation', 'category_id', 'direction',
    'audio_media_id', 'audio_transcribed', 'local_media_id', 'multimedia_url',
    'sync_status', 'last_synced_at'
  ];
  const setParts: string[] = [];
  const params: any[] = [];

  for (const key of allowedKeys) {
    if (key in updates) {
      setParts.push(`${key} = ?`);
      let value = (updates as any)[key];
      // Convert boolean to 0/1 for audio_transcribed
      if (key === 'audio_transcribed' && typeof value === 'boolean') {
        value = value ? 1 : 0;
      }
      params.push(value);
    }
  }

  if (setParts.length === 0) return; // nothing to do

  params.push(id);
  const sql = `UPDATE observations SET ${setParts.join(', ')} WHERE id = ?`;
  await db!.runAsync(sql, params);
}

/**
 * Delete an observation record by id.
 *
 * Removes the observation from the database. Associated media records
 * must be deleted separately using removeMedia from MediaManager.
 *
 * @param id - Observation record UUID to delete
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   // Delete the observation and any associated media
 *   await removeObservationById('obs-uuid-123');
 *   // Then delete associated media records and files
 *   // (you may query observation_media table first to find related media)
 */
export async function removeObservationById(id: string): Promise<void> {
  const db = await getDatabase();
  await db!.runAsync(`DELETE FROM observations WHERE id = ?`, [id]);
}
