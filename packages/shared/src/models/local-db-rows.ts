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
  user_id: string;
  project_id: string | null;
  start_time: number | null;
  end_time: number | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  created_at: number;
}

/**
 * Represents an observation record in the local SQLite database.
 */
export interface Observation {
  id: string;
  trip_id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  observation: string | null;
  category_id: string | null;
  created_at: number;
}

/**
 * Represents an observation media record in the local SQLite database.
 */
export interface ObservationMedia {
  id: string;
  observation_id: string;
  local_file_path: string;
  media_type: string | null;
  file_size: number | null;
  created_at: number;
}
