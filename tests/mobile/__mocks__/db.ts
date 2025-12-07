// tests/mobile/__mocks__/db.ts
// Centralized mock "SQLite" instance used in tests.
//
// This file is used by db.test.ts (and any other tests)
// via: jest.mock('expo-sqlite', () => require('../__mocks__/db'));

export const execAsyncMock = jest.fn<Promise<void>, any>();
export const getAllAsyncMock = jest.fn<Promise<any[]>, any>();
export const runAsyncMock = jest.fn<Promise<void>, any>();

// This simulates SQLite.openDatabaseAsync(...)
export const openDatabaseAsyncMock = jest.fn(async () => {
  return {
    execAsync: execAsyncMock,
    getAllAsync: getAllAsyncMock,
    runAsync: runAsyncMock,
  };
});

// Named export to match expo-sqlite API
export const openDatabaseAsync = openDatabaseAsyncMock;

// Default export so `import * as SQLite` also works if needed
export default {
  openDatabaseAsync: openDatabaseAsyncMock,
};
