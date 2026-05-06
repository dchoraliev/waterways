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

type SupabaseJwtPayload = {
  role?: unknown;
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

const defaultUnavailableErrorMessage =
  'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for web, or EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for mobile.';

const decodeJwtPayload = (jwt: string): SupabaseJwtPayload | null => {
  const parts = jwt.split('.');
  if (parts.length < 2) {
    return null;
  }

  const normalizedPayload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');

  try {
    if (typeof globalThis.atob === 'function') {
      return JSON.parse(globalThis.atob(paddedPayload)) as SupabaseJwtPayload;
    }
  } catch {
    return null;
  }

  return null;
};

const getSupabaseKeyRole = (key: string): string | null => {
  const payload = decodeJwtPayload(key);
  return typeof payload?.role === 'string' ? payload.role : null;
};

const supabaseKeyRole = getSupabaseKeyRole(supabaseAnonKey);
const isUnexpectedSupabaseKeyRole = !!supabaseKeyRole && supabaseKeyRole !== 'anon';
const invalidRoleErrorMessage = isUnexpectedSupabaseKeyRole
  ? `Invalid Supabase client key role "${supabaseKeyRole}". Client applications must use the anon key.`
  : defaultUnavailableErrorMessage;

function createUnavailableSupabaseClient(errorMessage: string): SupabaseClient<Database> {
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
  console.error(defaultUnavailableErrorMessage);
}

if (isUnexpectedSupabaseKeyRole) {
  console.error(invalidRoleErrorMessage);
}

/**
 * Shared Supabase client instance with typed database schema.
 * Can be used across mobile and web apps.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey && !isUnexpectedSupabaseKeyRole
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: AsyncStorage,
        },
      })
    : createUnavailableSupabaseClient(invalidRoleErrorMessage);

// Export types for convenience
export type { Database, Tables, TablesInsert, TablesUpdate } from '../models/database-types';
