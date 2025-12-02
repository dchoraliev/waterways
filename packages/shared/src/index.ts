// Load environment variables from .env file
import 'dotenv/config';

export const config = {
  appName: 'Waterways',
  version: '1.0.0',
};

// Export Supabase client and types
export { supabase } from './supabase/client';
export type { Database, Tables, TablesInsert, TablesUpdate } from './models/database-types';

// Export local SQLite row types
export type {
  Trip as TripRow,
  Observation as ObservationRow,
  ObservationMedia as ObservationMediaRow,
} from './models/local-db-rows';

// Export database schema
export {
  CREATE_TRIPS_TABLE,
  CREATE_OBSERVATIONS_TABLE,
  CREATE_OBSERVATION_MEDIA_TABLE,
  CREATE_OBSERVATIONS_TRIP_ID_INDEX,
  CREATE_OBSERVATION_MEDIA_OBSERVATION_ID_INDEX,
  CREATE_ALL_TABLES,
} from './database/schema';
