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
import { ALL_TABLES, TABLE_MIGRATIONS } from '@waterways/shared/src/database/schema';

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
/**
 * Return the singleton database instance, initializing it on first access.
 *
 * This function is the single entry point other modules should use.
 * It guarantees that `initializeDatabase()` has run and that `db` is
 * ready to accept `runAsync`, `getAllAsync`, and `execAsync` calls.
 */
export async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
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
  try {
    // Open or create the database file
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable WAL mode for better concurrent read/write performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create all tables and indexes from the shared schema. Each
    // statement is executed individually so we can surface which
    // statement fails (if any) during initialization.
    for (const statement of ALL_TABLES) {
      if (statement.trim()) {
        await db.execAsync(statement);
      }
    }

    // --------------------------
    // Migration helpers
    // --------------------------
    /**
     * Check whether a table exists in sqlite_master.
     * Using sqlite_master avoids calling PRAGMA on missing tables.
     */
    async function tableExists(tableName: string): Promise<boolean> {
      const rows = await db!.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
        [tableName]
      );
      return rows && rows.length > 0;
    }

    /**
     * Return a Set of existing column names for a table using PRAGMA table_info.
     * The result is used to determine which ALTERs to run.
     */
    async function getExistingColumns(tableName: string): Promise<Set<string>> {
      const rows = await db!.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
      return new Set(rows.map((r) => r.name));
    }

    /**
     * Run migrations from `TABLE_MIGRATIONS`.
     * For each table we:
     *  - verify table exists
     *  - compute missing columns
     *  - execute ALTER TABLE ADD COLUMN for missing ones
     *
     * This function is idempotent and safe to call on every startup.
     */
    async function runMigrations() {
      for (const [tableName, cols] of Object.entries(TABLE_MIGRATIONS)) {
        try {
          const exists = await tableExists(tableName);
          if (!exists) {
            console.warn(`Table '${tableName}' does not exist yet; skipping migrations for it.`);
            continue;
          }

          const existing = await getExistingColumns(tableName);
          const missing = cols.filter((c) => !existing.has(c.name));
          if (missing.length === 0) continue;

          console.log(`Applying ${missing.length} migrations for table '${tableName}'`);
          for (const col of missing) {
            try {
              console.log(` - Adding column '${col.name}' to '${tableName}'`);
              await db!.execAsync(col.addStmt);
              console.log(`   ✓ Added ${col.name}`);
            } catch (innerErr) {
              // Fail fast: a migration failing usually indicates an unexpected
              // environment or schema state that should be investigated.
              console.error(`Failed to apply migration for ${tableName}.${col.name}:`, innerErr);
              throw innerErr;
            }
          }
        } catch (err) {
          console.error(`Migration failed for table '${tableName}':`, err);
          throw err;
        }
      }
    }

    // Execute migrations after tables are ensured
    await runMigrations();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
