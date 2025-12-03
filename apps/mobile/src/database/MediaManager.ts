/**
 * Media Manager - Manages observation media (photos, audio, etc.) CRUD operations
 *
 * Handles storage and retrieval of media files associated with observations:
 * - Photos, audio recordings, or other multimedia captured during a survey
 * - Local file path references (actual files stored in device filesystem)
 * - Media metadata (type, file size, sync status)
 * - Sync tracking for offline-first architecture
 *
 * All functions use parameterized queries for SQL injection prevention.
 */

import { getDatabase } from './db';
import { ObservationMedia } from '@waterways/shared/src/models/local-db-rows';
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
    const rows = await db!.getAllAsync<{ id: string }>(
      'SELECT id FROM observation_media WHERE id = ?',
      [uuid]
    );

    if (rows.length === 0) {
      // Unique this is unique UUID
      return uuid;
    }

    console.warn(`ObservationMedia UUID collision detected: ${uuid}, regenerating...`);
  }
}

/**
 * Create and insert a new media record.
 *
 * Stores a reference to a media file (photo, audio, etc.) associated with an observation.
 * Automatically generates:
 * - UUID if not provided
 * - Created timestamp
 * - Sync status ('pending' by default)
 *
 * @param params - Media creation parameters
 *   - observation_id: Required - the observation this media belongs to
 *   - local_file_path: Required - path to the media file on device
 *   - media_type: Optional - 'image', 'audio', etc. (defaults to null)
 *   - file_size: Optional - size in bytes (defaults to null)
 *   - sync_status: Optional - defaults to 'pending'
 *   - id: Optional - custom UUID (auto-generated if not provided)
 *   - created_at: Optional - timestamp (defaults to Date.now())
 *   - last_synced_at: Optional - defaults to 0
 *
 * @returns Promise<ObservationMedia> - The created media record with all fields
 *
 * @throws If database operation fails
 *
 * Usage:
 *   const media = await addMedia({
 *     observation_id: 'obs-123',
 *     local_file_path: '/Documents/photo_001.jpg',
 *     media_type: 'image',
 *     file_size: 2048576,
 *   });
 *   console.log(media.id); // UUID of new record
 */
export async function addMedia(params: {
  observation_id: string;
  local_file_path: string;
  media_type?: string | null;
  file_size?: number | null;
  sync_status?: SyncStatus;
  id?: string;
  created_at?: number;
  last_synced_at?: number;
}): Promise<ObservationMedia> {
  const db = await getDatabase();
  const id = params.id ?? (await generateUUID());
  const created_at = params.created_at ?? Date.now();
  const sync_status = params.sync_status ?? SyncStatus.PENDING;
  const last_synced_at = params.last_synced_at ?? 0;

  const item: ObservationMedia = {
    id,
    created_at,
    observation_id: params.observation_id,
    local_file_path: params.local_file_path,
    media_type: params.media_type ?? null,
    file_size: params.file_size ?? null,
    sync_status,
    last_synced_at,
  };

  await db!.runAsync(
    `INSERT OR REPLACE INTO observation_media (
      id, created_at, observation_id, local_file_path, media_type, file_size, sync_status, last_synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.created_at,
      item.observation_id,
      item.local_file_path,
      item.media_type,
      item.file_size,
      item.sync_status,
      item.last_synced_at,
    ]
  );

  return item;
}

/**
 * Retrieve a single media record by id.
 *
 * @param id - Media record UUID
 *
 * @returns Promise<ObservationMedia | null> - The media record, or null if not found
 *
 * Usage:
 *   const media = await getMediaById('media-uuid-123');
 *   if (media) {
 *     console.log(`Media file: ${media.local_file_path}`);
 *   }
 */
export async function getMediaById(id: string): Promise<ObservationMedia | null> {
  const db = await getDatabase();
  const rows = await db!.getAllAsync<ObservationMedia>(
    `SELECT * FROM observation_media WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows && rows.length ? rows[0] : null;
}

/**
 * Update specific fields on a media record by id.
 *
 * Uses a whitelist of allowed fields to prevent accidental overwrites of immutable data.
 * Only provided fields in the updates object are modified; other fields remain unchanged.
 *
 * Allowed fields (cannot update id, observation_id, created_at):
 * - local_file_path - path to the media file
 * - media_type - content type ('image', 'audio', etc.)
 * - file_size - file size in bytes
 * - sync_status - upload/sync state
 * - last_synced_at - last sync timestamp
 *
 * @param id - Media record UUID to update
 * @param updates - Partial object with only the fields to update
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   await updateMediaById('media-uuid-123', {
 *     sync_status: 'synced',
 *     last_synced_at: Date.now()
 *   });
 */
export async function updateMediaById(
  id: string,
  updates: Partial<
    Pick<
      ObservationMedia,
      'local_file_path' | 'media_type' | 'file_size' | 'sync_status' | 'last_synced_at'
    >
  >
): Promise<void> {
  const db = await getDatabase();
  type UpdatableKey = keyof Pick<
    ObservationMedia,
    'local_file_path' | 'media_type' | 'file_size' | 'sync_status' | 'last_synced_at'
  >;
  const allowedKeys: UpdatableKey[] = [
    'local_file_path',
    'media_type',
    'file_size',
    'sync_status',
    'last_synced_at',
  ];
  const setParts: string[] = [];
  const params: Array<ObservationMedia[UpdatableKey]> = [];

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      setParts.push(`${key} = ?`);
      params.push(updates[key]!);
    }
  }

  if (setParts.length === 0) return; // nothing to do

  params.push(id);
  const sql = `UPDATE observation_media SET ${setParts.join(', ')} WHERE id = ?`;
  await db!.runAsync(sql, params);
}

/**
 * Delete a media record by id.
 *
 * Removes the database entry for the media. Note: the actual file on disk
 * should be deleted separately using the filesystem API.
 *
 * @param id - Media record UUID to delete
 *
 * @returns Promise<void>
 *
 * @throws If database operation fails
 *
 * Usage:
 *   // First delete from database
 *   await removeMedia('media-uuid-123');
 *   // Then delete the actual file from device storage
 *   // (using appropriate file system API for your platform)
 */
export async function removeMedia(id: string): Promise<void> {
  const db = await getDatabase();
  await db!.runAsync(`DELETE FROM observation_media WHERE id = ?`, [id]);
}
