import { createClient } from '@supabase/supabase-js';
import type { Database } from '../models/database-types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables should be set in .env file at project root
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file contains SUPABASE_URL and SUPABASE_ANON_KEY. For mobile, ensure babel.config.js is configured to inline these variables.'
  );
}

/**
 * Shared Supabase client instance with typed database schema.
 * Can be used across mobile and web apps.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: AsyncStorage,
  },
});

// Export types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate } from '../models/database-types';
