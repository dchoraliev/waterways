// ============================================
// EXPECTED SCHEMA
// ============================================

export const EXPECTED_SCHEMA: Record<string, string[]> = {
  trips: [
    'id',
    'user_id',
    'project_id',
    'created_at',
    'start_time',
    'end_time',
    'start_latitude',
    'start_longitude',
    'end_latitude',
    'end_longitude',
    'sync_status',
    'last_synced_at',
  ],
  observations: [
    'id',
    'user_id',
    'trip_id',
    'latitude',
    'longitude',
    'created_at',
    'audio_media_id',
    'audio_transcribed',
    'observation',
    'category_id',
    'direction',
    'local_media_id',
    'multimedia_url',
    'sync_status',
    'last_synced_at',
  ],
  observation_media: [
    'id',
    'created_at',
    'observation_id',
    'local_file_path',
    'media_type',
    'file_size',
    'sync_status',
    'last_synced_at',
  ],
};

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
  sync_status TEXT NOT NULL DEFAULT 'pending',
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
  multimedia_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
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

export const CREATE_ALL_TABLES = [
  CREATE_TRIPS_TABLE,
  CREATE_OBSERVATIONS_TABLE,
  CREATE_OBSERVATION_MEDIA_TABLE,
  CREATE_OBSERVATIONS_TRIP_ID_INDEX,
  CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX,
];

// ============================================
// DROP ALL TABLES ARRAY
// ============================================
export const DROP_ALL_TABLES = [
  `DROP TABLE IF EXISTS observation_media;`,
  `DROP TABLE IF EXISTS observations;`,
  `DROP TABLE IF EXISTS trips;`,
];
