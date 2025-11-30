// ============================================
// LOCAL TRIPS TABLE
// ============================================

export const CREATE_TRIPS_TABLE = `
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  created_at INTEGER NOT NULL,
  start_time INTEGER,
  end_time INTEGER,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  sync_status TEXT,
  last_synced_at INTEGER NOT NULL DEFAULT 0
);
`;

// ============================================
// LOCAL OBSERVATIONS TABLE
// ============================================

export const CREATE_OBSERVATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_at INTEGER NOT NULL,
  audio_media_id TEXT,
  audio_transcribed INTEGER DEFAULT 0,
  observation TEXT,
  category_id TEXT,
  direction TEXT,
  local_media_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  multimedia_url TEXT,
  last_synced_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);
`;

// ============================================
// LOCAL OBSERVATION MEDIA TABLE
// ============================================

export const CREATE_OBSERVATION_MEDIA_TABLE = `
CREATE TABLE IF NOT EXISTS observation_media (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  observation_id TEXT NOT NULL,
  local_file_path TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  file_size INTEGER,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  last_synced_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);
`;

// ============================================
// INDEXES
// ============================================

export const CREATE_OBSERVATIONS_TRIP_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_observations_trip_id ON observations(trip_id);
`;

export const CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX = `
CREATE INDEX IF NOT EXISTS idx_observation_media_observation_id ON observation_media(observation_id);
`;

// ============================================
// ALL TABLES ARRAY
// ============================================

export const ALL_TABLES = [
  CREATE_TRIPS_TABLE,
  CREATE_OBSERVATIONS_TABLE,
  CREATE_OBSERVATION_MEDIA_TABLE,
  CREATE_OBSERVATIONS_TRIP_ID_INDEX,
  CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX,
];

// ============================================
// MIGRATIONS
// ============================================
// A mapping of table -> columns to ensure exist on older databases.
// Each entry contains the column `name` and the SQL `addStmt` to run
// when the column is missing. These are intentionally simple ALTER
// statements; the runtime will check PRAGMA table_info(...) before
// executing them to avoid errors on up-to-date databases.
export const TABLE_MIGRATIONS: Record<string, Array<{ name: string; addStmt: string }>> = {
  trips: [
    { name: 'sync_status', addStmt: `ALTER TABLE trips ADD COLUMN sync_status TEXT;` },
    {
      name: 'last_synced_at',
      addStmt: `ALTER TABLE trips ADD COLUMN last_synced_at INTEGER NOT NULL DEFAULT 0;`,
    },
  ],
  observations: [
    {
      name: 'sync_status',
      addStmt: `ALTER TABLE observations ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';`,
    },
    {
      name: 'last_synced_at',
      addStmt: `ALTER TABLE observations ADD COLUMN last_synced_at INTEGER NOT NULL DEFAULT 0;`,
    },
  ],
  observation_media: [
    {
      name: 'sync_status',
      addStmt: `ALTER TABLE observation_media ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';`,
    },
    {
      name: 'last_synced_at',
      addStmt: `ALTER TABLE observation_media ADD COLUMN last_synced_at INTEGER NOT NULL DEFAULT 0;`,
    },
  ],
};
