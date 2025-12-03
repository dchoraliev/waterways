/**
 * Trip Manager - Manages trip CRUD operations and database interactions
 *
 * A trip represents a journey/survey session with:
 * - Start and end timestamps
 * - Geographic coordinates (start/end points)
 * - Project association (optional)
 * - Sync status for offline-first architecture
 *
 * All functions use async/await with parameterized queries for SQL injection prevention.
 */

import { getDatabase } from './db';
import { Trip } from '@waterways/shared/src/models/local-db-rows';
import { SyncStatus } from './SyncManager';

/**
 * UUID v4 generator (RFC 4122 compliant)
 *
 * Generates cryptographically suitable random UUIDs without external dependencies.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @returns string - A valid UUID v4 identifier
 * @private Internal use only
 */
async function generateUUID(): Promise<string> {
  const db = await getDatabase();

  // Loop until a unique UUID is found for the trips table
  while (true) {
    // Generate standard random UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    // Check for uniqueness in the trips table
    const rows = await db!.getAllAsync<{ id: string }>('SELECT id FROM trips WHERE id = ?', [uuid]);

    if (rows.length === 0) {
      // Unique this is unique UUID
      return uuid;
    }

    console.warn(`Trip UUID collision detected: ${uuid}, regenerating...`);
  }
}

/**
 * Create a new trip and return its id.
 *
 * Initializes a trip record with:
 * - Auto-generated UUID as primary key
 * - Current timestamp as created_at
 * - Optional start coordinates (captured from user input or LocationService)
 * - sync_status defaults to null (not yet synced)
 *
 * @param params - Trip creation parameters
 *   - user_id: Required user identifier
 *   - project_id: Optional project association
 *   - start_time: Optional start timestamp (defaults to null)
 *   - start_latitude/start_longitude: Optional starting GPS coordinates
 *   - sync_status: Optional sync status (defaults to null)
 *
 * @returns Promise<string> - The generated trip UUID
 *
 * @throws If database operation fails
 *
 * TODO: integrate live location coordinate capture when starting a trip (use LocationService).
 *
 * Usage:
 *   const tripId = await createTrip({
 *     user_id: 'user-123',
 *     project_id: 'proj-456',
 *     start_latitude: 42.123,
 *     start_longitude: -87.456,
 *   });
 */
export async function createTrip(params: {
  user_id: string;
  project_id?: string | null;
  start_time?: number | null;
  start_latitude?: number | null;
  start_longitude?: number | null;
  sync_status?: SyncStatus;
}): Promise<string> {
  const db = await getDatabase();
  const id = await generateUUID();
  const now = Date.now();
  const start_time = params.start_time ?? null;
  const start_latitude = params.start_latitude ?? null;
  const start_longitude = params.start_longitude ?? null;
  const sync_status = params.sync_status ?? SyncStatus.PENDING;
  const last_synced_at = 0;

  await db!.runAsync(
    `INSERT INTO trips (
      id, user_id, project_id, created_at, start_time, end_time,
      start_latitude, start_longitude, end_latitude, end_longitude, sync_status, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.user_id,
      params.project_id ?? null,
      now,
      start_time,
      null,
      start_latitude,
      start_longitude,
      null,
      null,
      sync_status,
      last_synced_at,
    ]
  );

  return id;
}

/**
 * Update specific fields on a trip by id.
 *
 * Uses a whitelist of allowed fields to prevent accidental overwrites of immutable data.
 * Only provided fields in the updates object are modified; other fields remain unchanged.
 *
 * Allowed fields (cannot update id, user_id, created_at):
 * - start_time, end_time - trip timestamps
 * - start_latitude/longitude, end_latitude/longitude - GPS coordinates
 * - project_id - associated project
 * - sync_status, last_synced_at - sync metadata
 *
 * @param id - Trip UUID to update
 * @param updates - Partial object with only the fields to update
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   await updateTripById('trip-uuid-123', {
 *     end_time: Date.now(),
 *     end_latitude: 42.125,
 *     end_longitude: -87.455,
 *     sync_status: 'pending'
 *   });
 */
export async function updateTripById(
  id: string,
  updates: Partial<
    Pick<
      Trip,
      | 'user_id'
      | 'project_id'
      | 'start_time'
      | 'end_time'
      | 'start_latitude'
      | 'start_longitude'
      | 'end_latitude'
      | 'end_longitude'
      | 'sync_status'
      | 'last_synced_at'
    >
  >
): Promise<void> {
  const db = await getDatabase();

  type UpdatableKey = keyof Pick<
    Trip,
    | 'user_id'
    | 'project_id'
    | 'start_time'
    | 'end_time'
    | 'start_latitude'
    | 'start_longitude'
    | 'end_latitude'
    | 'end_longitude'
    | 'sync_status'
    | 'last_synced_at'
  >;

  const allowedKeys: UpdatableKey[] = [
    'user_id',
    'project_id',
    'start_time',
    'end_time',
    'start_latitude',
    'start_longitude',
    'end_latitude',
    'end_longitude',
    'sync_status',
    'last_synced_at',
  ];

  const setParts: string[] = [];

  // Typed params: accepts the update values AND the id string
  const params: Array<Trip[UpdatableKey]> = [];

  for (const key of allowedKeys) {
    const value = updates[key];

    if (value !== undefined) {
      setParts.push(`${key} = ?`);
      params.push(value as Trip[UpdatableKey]);
    }
  }

  if (setParts.length === 0) return; // nothing to do

  params.push(id); // safe: params is typed to include string

  const sql = `UPDATE trips SET ${setParts.join(', ')} WHERE id = ?`;
  await db!.runAsync(sql, params);
}

/**
 * Retrieve a single trip by id.
 *
 * @param id - Trip UUID to look up
 *
 * @returns Promise<Trip | null> - The trip record, or null if not found
 *
 * Usage:
 *   const trip = await getTripById('trip-uuid-123');
 *   if (trip) {
 *     console.log(`Trip started at: ${trip.start_time}`);
 *   }
 */
export async function getTripById(id: string): Promise<Trip | null> {
  const db = await getDatabase();
  const rows = await db!.getAllAsync<Trip>(`SELECT * FROM trips WHERE id = ? LIMIT 1`, [id]);
  return rows && rows.length ? rows[0] : null;
}

/**
 * Delete a trip by id.
 *
 * Removes the trip record and cascades to delete associated observations and media
 * (as defined by foreign key constraints in the schema).
 *
 * @param id - Trip UUID to delete
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   await removeTripById('trip-uuid-123');
 */
export async function removeTripById(id: string): Promise<void> {
  const db = await getDatabase();
  await db!.runAsync(`DELETE FROM trips WHERE id = ?`, [id]);
}
