import { createClient } from '@supabase/supabase-js';
import type { Database } from '@waterways/shared/src/models/database-types';
import { supabaseUrl, supabaseAnonKey } from './supabaseEnv';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

/**
 * Supabase client for web app with persistent browser storage for auth sessions.
 */
function getAuthStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const storage = window.localStorage;
    const probeKey = 'waterways-auth-storage-check';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    try {
      const storage = window.sessionStorage;
      const probeKey = 'waterways-auth-storage-check';
      storage.setItem(probeKey, '1');
      storage.removeItem(probeKey);
      return storage;
    } catch {
      return undefined;
    }
  }
}

const authStorage = getAuthStorage();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: authStorage,
  },
});

export type { Database };
