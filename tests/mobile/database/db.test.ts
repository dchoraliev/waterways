// tests/mobile/database/db.test.ts

// --- Mock expo-sqlite with a factory that exposes its mocks --- //
jest.mock('expo-sqlite', () => {
  const execAsyncMock = jest.fn().mockResolvedValue(undefined);
  const getAllAsyncMock = jest.fn().mockResolvedValue([] as any[]);
  const runAsyncMock = jest.fn().mockResolvedValue(undefined);

  const openDatabaseAsyncMock = jest.fn(async () => ({
    execAsync: execAsyncMock,
    getAllAsync: getAllAsyncMock,
    runAsync: runAsyncMock,
  }));

  return {
    openDatabaseAsync: openDatabaseAsyncMock,
    // expose mocks so tests can access them
    __mocks__: {
      execAsyncMock,
      getAllAsyncMock,
      runAsyncMock,
      openDatabaseAsyncMock,
    },
  };
});

// --- Mock schema so db.ts can import it --- //
const EXPECTED_SCHEMA_MOCK: Record<string, string[]> = {
  trips: ['id', 'user_id', 'created_at'],
  observations: ['id', 'trip_id', 'created_at'],
  observation_media: ['id', 'observation_id', 'local_file_path', 'created_at'],
};

const CREATE_ALL_TABLES_MOCK = [
  'CREATE TABLE trips (id TEXT PRIMARY KEY, user_id TEXT, created_at INTEGER);',
  'CREATE TABLE observations (id TEXT PRIMARY KEY, trip_id TEXT, created_at INTEGER);',
  'CREATE TABLE observation_media (id TEXT PRIMARY KEY, observation_id TEXT, local_file_path TEXT, created_at INTEGER);',
];

const DROP_ALL_TABLES_MOCK = [
  'DROP TABLE IF EXISTS observation_media;',
  'DROP TABLE IF EXISTS observations;',
  'DROP TABLE IF EXISTS trips;',
];

jest.mock('@waterways/shared/src/database/schema', () => ({
  EXPECTED_SCHEMA: EXPECTED_SCHEMA_MOCK,
  CREATE_ALL_TABLES: CREATE_ALL_TABLES_MOCK,
  DROP_ALL_TABLES: DROP_ALL_TABLES_MOCK,
}));

// Handles to the mocks inside expo-sqlite
let execAsyncMock: jest.Mock;
let getAllAsyncMock: jest.Mock;
let runAsyncMock: jest.Mock;
let openDatabaseAsyncMock: jest.Mock;

// Helpers to configure schema behavior ---------------------------------

function mockValidSchema() {
  getAllAsyncMock.mockImplementation(async (sql: string, params?: any[]) => {
    // Table exists?
    if (sql.startsWith('SELECT name FROM sqlite_master')) {
      const tableName = params?.[0];
      return [{ name: tableName }];
    }

    // PRAGMA table_info(table)
    if (sql.startsWith('PRAGMA table_info(')) {
      const match = sql.match(/PRAGMA table_info\((.+)\);/);
      const tableName = match?.[1];
      const cols = EXPECTED_SCHEMA_MOCK[tableName ?? ''] ?? [];
      return cols.map((name) => ({ name }));
    }

    // Everything else: just return an empty array
    return [];
  });
}

function mockInvalidSchema() {
  getAllAsyncMock.mockImplementation(async (sql: string, params?: any[]) => {
    // Tables "exist"
    if (sql.startsWith('SELECT name FROM sqlite_master')) {
      const tableName = params?.[0];
      return [{ name: tableName }];
    }

    // But PRAGMA returns no columns → schema invalid
    if (sql.startsWith('PRAGMA table_info(')) {
      return [];
    }

    return [];
  });
}

// ----------------------------------------------------------------------

describe('database/db.ts', () => {
  beforeEach(() => {
    // Reset module registry so db.ts gets a fresh singleton each test
    jest.resetModules();
    jest.clearAllMocks();

    // Re-require expo-sqlite so we can grab the mocks from __mocks__
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require('expo-sqlite');

    ({ execAsyncMock, getAllAsyncMock, runAsyncMock, openDatabaseAsyncMock } = (
      SQLite as any
    ).__mocks__);
  });

  test('getDatabase initializes once and returns a singleton', async () => {
    mockValidSchema();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDatabase } = require('@waterways/mobile/src/database/db');

    const db1 = await getDatabase();
    const db2 = await getDatabase();

    expect(openDatabaseAsyncMock).toHaveBeenCalledTimes(1);
    expect(db1).toBe(db2);
  });

  test('initializeDatabase runs WAL pragma and CREATE statements when schema valid', async () => {
    mockValidSchema();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeDatabase } = require('@waterways/mobile/src/database/db');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CREATE_ALL_TABLES } = require('@waterways/shared/src/database/schema');

    await initializeDatabase();

    expect(openDatabaseAsyncMock).toHaveBeenCalledTimes(1);
    expect(execAsyncMock).toHaveBeenCalledWith('PRAGMA journal_mode = WAL;');

    for (const stmt of CREATE_ALL_TABLES) {
      if (stmt.trim()) {
        expect(execAsyncMock).toHaveBeenCalledWith(stmt);
      }
    }
  });

  test('initializeDatabase drops and recreates tables when schema invalid', async () => {
    mockInvalidSchema();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeDatabase } = require('@waterways/mobile/src/database/db');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CREATE_ALL_TABLES, DROP_ALL_TABLES } = require('@waterways/shared/src/database/schema');

    await initializeDatabase();

    // All DROP statements executed
    for (const drop of DROP_ALL_TABLES) {
      if (drop.trim()) {
        expect(execAsyncMock).toHaveBeenCalledWith(drop);
      }
    }

    // And then CREATE statements executed
    for (const stmt of CREATE_ALL_TABLES) {
      if (stmt.trim()) {
        expect(execAsyncMock).toHaveBeenCalledWith(stmt);
      }
    }
  });
});
