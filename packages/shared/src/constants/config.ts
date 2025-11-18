export const APP_CONFIG = {
  appName: 'WaDE',
  appDisplayName: 'Waterway Delta Explorer',
  defaultLocale: 'en',
  api: {
    // Set these to your real values when you wire APIs / Supabase
    baseUrl: '',
    requestTimeoutMs: 10000,
  },
  support: {
    email: 'support@example.com',
  },
};

export type AppConfig = typeof APP_CONFIG;
