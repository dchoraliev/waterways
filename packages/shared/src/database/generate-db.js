import Database from 'better-sqlite3';
import { join } from 'path';

// Define schema directly here
const CREATE_TRIPS_TABLE = `
CREATE TABLE trips (
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

const CREATE_OBSERVATIONS_TABLE = `
CREATE TABLE observations (
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

const CREATE_OBSERVATION_MEDIA_TABLE = `
CREATE TABLE observation_media (
  id TEXT PRIMARY KEY,
  observation_id TEXT NOT NULL,
  local_file_path TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  file_size INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
);
`;

const CREATE_OBSERVATIONS_TRIP_ID_INDEX = `
CREATE INDEX idx_observations_trip_id ON observations(trip_id);
`;

const CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX = `
CREATE INDEX idx_observation_media_observation_id ON observation_media(observation_id);
`;

const ALL_TABLES = [
  CREATE_TRIPS_TABLE,
  CREATE_OBSERVATIONS_TABLE,
  CREATE_OBSERVATION_MEDIA_TABLE,
  CREATE_OBSERVATIONS_TRIP_ID_INDEX,
  CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX,
];

// Create database in current directory
const dbPath = join(__dirname, 'waterways.db');

console.log(`Creating database at: ${dbPath}\n`);

const db = new Database(dbPath);

try {
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Execute all table and index creation statements
  db.exec(ALL_TABLES.join('\n'));

  console.log('✓ Database created successfully!\n');

  // Verify tables were created
  const tables = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `
    )
    .all();

  console.log('Tables created:');
  tables.forEach((table) => console.log(`  - ${table.name}`));

  // Verify indexes were created
  const indexes = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name LIKE 'idx_%'
    ORDER BY name
  `
    )
    .all();

  console.log('\nIndexes created:');
  indexes.forEach((index) => console.log(`  - ${index.name}`));

  console.log(`\n✓ Database file ready at: ${dbPath}`);
  console.log('You can now open this file with your SQLite viewer!');
} catch (error) {
  console.error('✗ Error creating database:', error);
  process.exit(1);
} finally {
  db.close();
}
