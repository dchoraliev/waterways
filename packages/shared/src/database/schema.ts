// ============================================
// LOCAL TRIPS TABLE
// ============================================

export const CREATE_TRIPS_TABLE = `
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  start_time INTEGER,
  end_time INTEGER,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  created_at INTEGER NOT NULL
);
`;

// ============================================
// LOCAL OBSERVATIONS TABLE
// ============================================

export const CREATE_OBSERVATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  observation TEXT,
  category_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);
`;

// ============================================
// LOCAL OBSERVATION MEDIA TABLE
// ============================================

export const CREATE_OBSERVATION_MEDIA_TABLE = `
CREATE TABLE IF NOT EXISTS observation_media (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  local_file_path TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  file_size INTEGER,
  created_at INTEGER NOT NULL,
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
