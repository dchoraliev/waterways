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
  latitude: number | null; // ← Changed from "null" to "number | null"
  longitude: number | null;
  created_at: number;
  audio_media_id: string | null;
  supabase_audio_media_id: string | null;
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

/**
 * Represents app-level settings persisted in local SQLite.
 */
export interface LocalSettings {
  id: number;
  dark_mode_enabled: number;
  notifications_enabled: number;
  daily_summary_email_enabled: number;
  daily_summary_email_sync_pending: number;
  show_name_on_map: number;
  show_name_on_map_sync_pending: number;
}

/**
 * Represents a category record in the local SQLite database.
 */
export interface Category {
  id: number;
  name: string;
  is_fallback: boolean;
  color: string | null;
  keywords: string | null;
}
