import path from 'node:path';
import dotenv from 'dotenv';

// Load your .env from the root (you uploaded it at repo root)
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const appVariant = process.env.APP_VARIANT ?? 'shared';
const isSandboxVariant = appVariant === 'sandbox';
const appName =
  process.env.APP_DISPLAY_NAME ?? (isSandboxVariant ? 'Waterways Sandbox' : 'Waterways');
const appScheme = process.env.EXPO_SCHEME ?? (isSandboxVariant ? 'waterways-sandbox' : 'waterways');
const iosBundleIdentifier =
  process.env.IOS_BUNDLE_ID ??
  (isSandboxVariant ? 'com.waterways.mobile.sandbox' : 'com.waterways.mobile');

export default {
  expo: {
    name: appName,
    scheme: appScheme,
    slug: 'mobile',
    owner: 'waterwaysse4330',
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

    ios: {
      bundleIdentifier: iosBundleIdentifier,
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSUserNotificationUsageDescription:
          'We use notifications to remind you to review and submit draft journeys.',
        NSMicrophoneUsageDescription:
          'Waterways needs microphone access to record and transcribe field observations.',
        NSSpeechRecognitionUsageDescription:
          'Waterways needs speech recognition to convert your voice notes into text observations.',
        NSCameraUsageDescription:
          'Waterways needs camera access to attach photos to your observations.',
        NSPhotoLibraryUsageDescription:
          'Waterways needs photo library access to let you attach existing images to observations.',
        NSPhotoLibraryAddUsageDescription:
          'Waterways can save captured photos to your photo library when you choose to.',
        NSLocationWhenInUseUsageDescription:
          'Waterways uses your location while the app is in use to tag observation locations accurately.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
    },

    plugins: ['expo-router', 'expo-notifications', './plugins/withAndroidCompatibility.js'],

    experiments: {
      autolinkingModuleResolution: true,
      typedRoutes: true,
    },

    // Load the Supabase env vars for mobile app
    extra: {
      APP_VARIANT: appVariant,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: '5e066005-7d80-4ab3-a8c0-19a219f2b0a6',
      },
      // Ensure Expo Router knows the `src/app` location in this workspace
      router: {
        root: 'src/app',
      },
    },
  },
};
