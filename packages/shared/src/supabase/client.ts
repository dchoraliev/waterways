import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../models/database-types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables should be set in .env file at project root
type RuntimeEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

const runtimeEnv =
  (typeof globalThis !== 'undefined'
    ? (globalThis as { process?: { env?: RuntimeEnv } }).process?.env
    : undefined) ?? {};

// Expo only inlines EXPO_PUBLIC_* when referenced directly as process.env.EXPO_PUBLIC_*.
const expoPublicSupabaseUrl =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined;
const expoPublicSupabaseAnonKey =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined;

const supabaseUrl =
  expoPublicSupabaseUrl ||
  runtimeEnv.EXPO_PUBLIC_SUPABASE_URL ||
  runtimeEnv.VITE_SUPABASE_URL ||
  runtimeEnv.SUPABASE_URL ||
  '';
const supabaseAnonKey =
  expoPublicSupabaseAnonKey ||
  runtimeEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv.VITE_SUPABASE_ANON_KEY ||
  runtimeEnv.SUPABASE_ANON_KEY ||
  '';

function createUnavailableSupabaseClient(): SupabaseClient<Database> {
  const errorMessage =
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for web, or EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for mobile.';

  const throwUnavailable = () => {
    throw new Error(errorMessage);
  };

  return new Proxy(throwUnavailable, {
    get: throwUnavailable,
    apply: throwUnavailable,
    set: throwUnavailable,
  }) as unknown as SupabaseClient<Database>;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for web, or EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for mobile.'
  );
}

/**
 * Shared Supabase client instance with typed database schema.
 * Can be used across mobile and web apps.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: AsyncStorage,
        },
      })
    : createUnavailableSupabaseClient();

// Export types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate } from '../models/database-types';
