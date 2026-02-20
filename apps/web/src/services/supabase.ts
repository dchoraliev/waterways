import { createClient } from '@supabase/supabase-js';
import type { Database } from '@waterways/shared/src/models/database-types';
import { supabaseUrl, supabaseAnonKey } from './supabaseEnv';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

/**
 * Supabase client for web app with sessionStorage for session persistence.
 */
const authStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: authStorage,
  },
});

export type { Database };
