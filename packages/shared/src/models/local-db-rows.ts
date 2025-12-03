// These mirror the SQLite row shapes used by the mobile app.
// Keep them in sync with apps/mobile/src/database/local-db-rows.ts.

export interface Trip {
  id: string;
  user_id: string;
  project_id: string | null;
  created_at: number;
  start_time: number | null;
  end_time: number | null;
  start_latitude: number | null;
  start_longitude: number | null;
  end_latitude: number | null;
  end_longitude: number | null;
  sync_status: string | null; // or a specific union if you want
  last_synced_at: number;
}

export interface Observation {
  id: string;
  user_id: string;
  trip_id: string;
  latitude: number | null;
  longitude: number | null;
  created_at: number;
  audio_media_id: string | null;
  audio_transcribed: number; // stored as 0/1 in SQLite
  observation: string | null;
  category_id: string | null;
  direction: string | null;
  local_media_id: string | null;
  multimedia_url: string | null;
  sync_status: string | null;
  last_synced_at: number;
}

export interface ObservationMedia {
  id: string;
  created_at: number;
  observation_id: string;
  local_file_path: string;
  media_type: string | null;
  file_size: number | null;
  sync_status: string | null;
  last_synced_at: number;
}
