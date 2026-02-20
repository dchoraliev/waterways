/* eslint-disable no-undef */
/// <reference lib="dom" />
// Polyfill fetch for Node.js (Jest)
export {}; // Make this file a module

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = (async () => {
    throw new Error('Global fetch is not available in the Jest runtime.');
  }) as typeof fetch;
}

// Set process.env for Supabase in tests
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
// Declare window on globalThis for Node/test environments
declare global {
  // Use the same type as the DOM lib
  var window: Window & typeof globalThis;
}

// Mock window.sessionStorage for SSR/test environments
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage,
  } as Window & typeof globalThis;
}
/// <reference types="jest" />

// This file ensures Jest types are available globally in test files
