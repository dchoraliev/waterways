/**
 * Database Module - Manages SQLite database initialization and lifecycle
 *
 * This module handles:
 * - Database initialization with schema creation
 * - Async database access singleton pattern
 * - WAL (Write-Ahead Logging) pragma for improved concurrency
 * - Transaction-wrapped schema execution
 */

import * as SQLite from "expo-sqlite";
import { ALL_TABLES } from '@waterways/shared/src/database/schema';
import { get } from 'http';

const DB_NAME = 'waterways.db';

/**
 * Module-level database reference (singleton pattern).
 * - `null` until first call to getDatabase()
 * - Once initialized, reused for all subsequent operations
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get the database instance, initializing if necessary.
 *
 * @returns Promise<SQLiteDatabase> - The singleton database instance
 * @throws If database initialization fails
 *
 * Usage:
 *   const db = await getDatabase();
 *   await db.runAsync('INSERT INTO ...', [...]);
 */
export async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

/**
 * Initialize the SQLite database with schema and pragmas.
 *
 * Performs:
 * 1. Opens/creates the database file
 * 2. Enables WAL mode for better concurrent read/write performance
 * 3. Wraps all schema creation in a single transaction for atomicity
 * 4. Creates all tables, indexes defined in ALL_TABLES
 *
 * @throws If database file cannot be created or schema cannot be applied
 *
 * Note: This is called automatically by getDatabase() on first access.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Open or create the database file
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Initialize database with pragmas and schema
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      BEGIN TRANSACTION;
      ${ALL_TABLES.join('\n')}
      COMMIT;
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Load (or ensure) the database is initialized.
 *
 * Convenience function that ensures database is ready for operations.
 * Useful for calling at app startup to prime the database.
 *
 * @returns Promise<void>
 */
export async function loadDatabase() {
  const database = await getDatabase();
}

/**
 * Close the database connection and reset the module reference.
 *
 * Call this when shutting down the app or before re-opening with fresh state.
 * After calling this, the next getDatabase() call will reinitialize.
 *
 * @returns void (synchronous, but db.closeAsync is fire-and-forget)
 */
export function closeDatabase() {
  if (db) {
    db.closeAsync();
    db = null;
  }
}

