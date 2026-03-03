import { Category } from '@shared/models/local-db-rows';
import { supabase } from '@shared/supabase/client';
import { getDatabase } from './db';

export async function syncCategoriesFromSupabase(): Promise<void> {
  // Fetch categories from Supabase
  const { data, error } = await supabase.from('observation_categories').select('*');

  if (error) {
    console.error('[CategoryManager] Error fetching categories from Supabase:', error);
    return;
  }

  if (data) {
    console.log(
      `[CategoryManager] Fetched ${data.length} categories from Supabase. Syncing them to local database...`
    );
    const db = await getDatabase();

    // Clear all existing categories in local database so only the new ones remain
    await db!.runAsync(`DELETE FROM categories`);

    // Insert the new categories from Supabase into the local database
    for (const category of data) {
      console.log('[CategoryManager] Syncing category: ', category);

      // Save it to the local database
      await db!.runAsync(
        `INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)`,
        [
          category.id,
          category.type,
          category.is_fallback,
          category.color,
          category.keywords?.toString() ?? null,
        ]
      );
    }
    console.log(
      '[CategoryManager] Replaced all the existing categories in local database with new ones.'
    );
  }
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const categories = await db!.getAllAsync<Category>(`SELECT * FROM categories`);
  return categories || [];
}
