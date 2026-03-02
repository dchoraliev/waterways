export const config = {
  appName: 'Waterways',
  version: '1.0.0',
};

// Export shared types
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

export { buildObservationRpcArgs, deriveHasMore, toNullableInt } from './utils/observation-query';

export type {
  ObservationBounds,
  ObservationQueryParams,
  ObservationRpcArgs,
  ObservationPageMeta,
} from './utils/observation-query';

export { DEFAULT_FILTER_OPTIONS, hasActiveObservationFilters } from './types/observation-filters';

export type { FilterOptions } from './types/observation-filters';
