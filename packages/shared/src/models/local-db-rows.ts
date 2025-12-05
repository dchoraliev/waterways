/**
 * TypeScript interfaces for local SQLite database rows.
 * These match the schema defined in schema.ts.
 *
 * Type mappings:
 * - TEXT -> string
 * - INTEGER -> number
 * - REAL -> number
 * - NULL allowed -> type | null
 */

/**
 * Represents a trip record in the local SQLite database.
 */
export interface Trip {
  id: string;
  supabase_id: string;
  user_id: string;
  project_id: string | null;
  created_at: number;
  start_time: number | null;
  end_time: number | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  sync_status: string | null;
  last_synced_at: number;
}

/**
 * Represents an observation record in the local SQLite database.
 */
export interface Observation {
  id: string;
  user_id: string;
  trip_id: string;
  supabase_trip_id: string | null;
  latitude: null;
  longitude: number | null;
  created_at: number;
  audio_media_id: string | null;
  audio_transcribed: boolean | false;
  observation: string | null;
  category_id: string | null;
  direction: string | null;
  local_media_id: string | null;
  sync_status: string;
  multimedia_url: string | null;
  last_synced_at: number;
}

/**
 * Represents an observation media record in the local SQLite database.
 */
export interface ObservationMedia {
  id: string;
  created_at: number;
  observation_id: string;
  local_file_path: string;
  media_type: string | null;
  file_size: number | null;
  sync_status: string;
  last_synced_at: number;
}

/**
 * Represents a sync log record in the local SQLite database.
 */
export interface SyncLog {
  id: number;
  table_name: string;
  record_id: string;
  status: string;
  timestamp: number;
  error_message: string | null;
}
