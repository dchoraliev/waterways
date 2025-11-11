import * as SQLite from 'expo-sqlite';
import { ALL_TABLES } from '@waterways/shared/src/database/schema';

const DB_NAME = 'waterways.db';

export async function initializeDatabase(): Promise<void> {
  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

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
