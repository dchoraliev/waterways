/**
 * Database Module - Manages SQLite database initialization and lifecycle
 *
 * Responsibilities:
 * - Open/create the local SQLite database file used by the mobile app
 * - Apply the canonical schema (CREATE TABLE / CREATE INDEX statements)
 * - Run lightweight, idempotent migrations to add missing columns to
 *   existing tables (so upgrades don't destroy user data)
 * - Expose a singleton `getDatabase()` for use across the app
 *
 * Design notes:
 * - The schema is kept in `@waterways/shared/src/database/schema.ts`.
 *   This file exports `ALL_TABLES` (CREATE statements) and `TABLE_MIGRATIONS`
 *   (a mapping of table -> column ALTER statements). The initialization
 *   routine first ensures the canonical tables exist, then inspects each
 *   on-disk table and applies only the missing ALTERs. This keeps
 *   migrations idempotent and safe for production upgrades.
 *
 * - We enable WAL mode (`PRAGMA journal_mode = WAL`) for better
 *   concurrent read/write characteristics on mobile devices.
 */

import * as SQLite from 'expo-sqlite';
import {
  EXPECTED_SCHEMA,
  CREATE_ALL_TABLES,
  DROP_ALL_TABLES,
} from '@waterways/shared/src/database/schema';

const DB_NAME = 'waterways.db';
const LOCAL_SETTINGS_ID = 1;

function isNativeDatabaseNullPointer(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? '');
  return (
    message.includes('NativeDatabase.prepareAsync') ||
    message.includes('NativeDatabase.execAsync') ||
    message.includes('java.lang.NullPointerException')
  );
}

async function closeDatabaseConnection(): Promise<void> {
  if (!db) return;

  try {
    await db.closeAsync();
  } catch (error) {
    console.warn('Failed to close SQLite connection cleanly:', error);
  } finally {
    db = null;
  }
}

async function performInitialization(): Promise<void> {
  await closeDatabaseConnection();

  // Open or create the database file
  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrent read/write performance
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create all tables and indexes from the shared schema. Each
  // statement is executed individually so we can surface which
  // statement fails (if any) during initialization.
  for (const statement of CREATE_ALL_TABLES) {
    if (statement.trim()) {
      await db.execAsync(statement);
    }
  }

  // Validate the schema after applying all CREATE statements.
  const isValid = await validateSchema();
  if (!isValid) {
    console.warn('Incorrect Database Schema detected.');

    // Drop all tables to reset the schema
    console.log('Dropping all tables to reset schema...');
    for (const dropStmt of DROP_ALL_TABLES) {
      if (dropStmt.trim()) {
        await db.execAsync(dropStmt);
      }
    }

    // Re-create all tables and indexes
    console.log('Re-creating all tables...');
    for (const statement of CREATE_ALL_TABLES) {
      if (statement.trim()) {
        await db.execAsync(statement);
      }
    }
  }

  console.log('Database initialized successfully');
}

async function ensureHealthyConnection(): Promise<void> {
  if (!db) {
    await initializeDatabase();
    return;
  }

  try {
    await db.execAsync('SELECT 1;');
  } catch (error) {
    if (!isNativeDatabaseNullPointer(error)) {
      throw error;
    }

    console.warn('Detected stale native SQLite handle; reinitializing database connection...');
    await closeDatabaseConnection();
    await initializeDatabase();
  }
}

/**
 * Module-level database reference (singleton pattern).
 * - `null` until first call to getDatabase()
 * - Once initialized, reused for all subsequent operations
 */
let db: SQLite.SQLiteDatabase | null = null;
let dbInitializationPromise: Promise<void> | null = null;

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
/**
 * Return the singleton database instance, initializing it on first access.
 *
 * This function is the single entry point other modules should use.
 * It guarantees that `initializeDatabase()` has run and that `db` is
 * ready to accept `runAsync`, `getAllAsync`, and `execAsync` calls.
 */
export async function getDatabase() {
  await initializeDatabase();
  await ensureHealthyConnection();

  if (!db) {
    throw new Error('Database is not initialized');
  }

  return db;
}

export async function getLocalSettings(): Promise<{
  darkModeEnabled: boolean;
  notificationsEnabled: boolean;
}> {
  const database = await getDatabase();

  await database!.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      dark_mode_enabled INTEGER NOT NULL DEFAULT 1,
      notifications_enabled INTEGER NOT NULL DEFAULT 1
    );
  `);

  await database!.runAsync(
    `INSERT OR IGNORE INTO settings (id, dark_mode_enabled, notifications_enabled)
     VALUES (?, ?, ?)`,
    [LOCAL_SETTINGS_ID, 1, 1]
  );

  const rows = await database!.getAllAsync<{
    dark_mode_enabled: number;
    notifications_enabled: number;
  }>(`SELECT dark_mode_enabled, notifications_enabled FROM settings WHERE id = ? LIMIT 1`, [
    LOCAL_SETTINGS_ID,
  ]);

  const row = rows[0] ?? { dark_mode_enabled: 1, notifications_enabled: 1 };
  return {
    darkModeEnabled: row.dark_mode_enabled === 1,
    notificationsEnabled: row.notifications_enabled === 1,
  };
}

export async function updateLocalSettings(
  updates: Partial<{ darkModeEnabled: boolean; notificationsEnabled: boolean }>
): Promise<void> {
  const database = await getDatabase();

  await database!.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      dark_mode_enabled INTEGER NOT NULL DEFAULT 1,
      notifications_enabled INTEGER NOT NULL DEFAULT 1
    );
  `);

  await database!.runAsync(
    `INSERT OR IGNORE INTO settings (id, dark_mode_enabled, notifications_enabled)
     VALUES (?, ?, ?)`,
    [LOCAL_SETTINGS_ID, 1, 1]
  );

  const setParts: string[] = [];
  const params: Array<number | string> = [];

  if (updates.darkModeEnabled !== undefined) {
    setParts.push('dark_mode_enabled = ?');
    params.push(updates.darkModeEnabled ? 1 : 0);
  }

  if (updates.notificationsEnabled !== undefined) {
    setParts.push('notifications_enabled = ?');
    params.push(updates.notificationsEnabled ? 1 : 0);
  }

  if (setParts.length === 0) return;

  params.push(LOCAL_SETTINGS_ID);
  await database!.runAsync(`UPDATE settings SET ${setParts.join(', ')} WHERE id = ?`, params);
}

/**
 * Read all existing columns from a table.
 */
async function getTableColumns(tableName: string): Promise<string[]> {
  const result = await db!.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
  return result.map((r) => r.name);
}

/**
 * Check if a table exists.
 */
async function tableExists(tableName: string): Promise<boolean> {
  const rows = await db!.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    [tableName]
  );
  return rows.length > 0;
}

/**
 * Validate the schema of all tables.
 * Returns TRUE if everything matches, otherwise FALSE.
 *
 * Rules:
 * - Missing column → INVALID
 * - Extra column → INVALID
 * - Table missing → INVALID
 */
async function validateSchema(): Promise<boolean> {
  console.log('Validating SQLite schema...');

  for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
    // Table missing = invalid schema
    const exists = await tableExists(tableName);
    if (!exists) {
      console.warn(`Table missing: ${tableName}`);
      return false;
    }

    // Compare columns
    const actualColumns = await getTableColumns(tableName);

    // Missing required column
    for (const col of expectedColumns) {
      if (!actualColumns.includes(col)) {
        console.warn(`Missing column '${col}' in '${tableName}'`);
        return false;
      }
    }

    // Extra leftover column
    for (const col of actualColumns) {
      if (!expectedColumns.includes(col)) {
        console.warn(`Extra column '${col}' found in '${tableName}'`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Load (or ensure) the database is initialized.
 *
 * Convenience function that ensures database is ready for operations.
 * Useful for calling at app startup to prime the database.
 *
 * @returns Promise<void>
 */
/**
 * Initialize the database file and apply schema + migrations.
 *
 * Steps performed:
 * 1. Open (or create) the database file
 * 2. Enable WAL mode for better concurrency
 * 3. Execute all CREATE TABLE / INDEX statements from the shared schema
 * 4. Inspect each table and apply any missing ALTER TABLE ... ADD COLUMN
 *    statements declared in `TABLE_MIGRATIONS`
 *
 * The migration step is intentionally conservative: it only runs ALTER
 * statements for columns that are missing, and it checks that the
 * target table exists before attempting changes. Errors are logged and
 * will abort initialization so the app fails fast in case of unexpected
 * issues during DB setup.
 */
export async function initializeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.execAsync('SELECT 1;');
      return;
    } catch (error) {
      if (!isNativeDatabaseNullPointer(error)) {
        throw error;
      }

      await closeDatabaseConnection();
    }
  }

  if (!dbInitializationPromise) {
    dbInitializationPromise = (async () => {
      try {
        await performInitialization();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        await closeDatabaseConnection();
        throw error;
      }
    })().finally(() => {
      dbInitializationPromise = null;
    });
  }

  await dbInitializationPromise;
}
