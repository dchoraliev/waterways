import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

// Load your .env from the root (you uploaded it at repo root)
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

export default {
  expo: {
    name: 'mobile',
    scheme: 'waterways',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    android: {
      package: 'com.waterways.mobile',
      permissions: ['android.permission.RECORD_AUDIO', 'android.permission.INTERNET'],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    plugins: ['expo-router', './plugins/withAndroidCompatibility.js'],

    experiments: {
      typedRoutes: true,
    },

    // Load the Supabase env vars for mobile app
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'de247055-1e3a-4887-8d8b-1b633101d7b8',
      },
      // Ensure Expo Router knows the `src/app` location in this workspace
      router: {
        root: 'src/app',
      },
    },
  },
};
