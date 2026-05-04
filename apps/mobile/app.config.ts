import path from 'node:path';
import dotenv from 'dotenv';

// Load your .env from the root (you uploaded it at repo root)
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
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
    runtimeVersion: {
      policy: 'appVersion',
    },
    orientation: 'portrait',
    icon: './assets/logo/waterways-logo.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    updates: {
      url: 'https://u.expo.dev/5e066005-7d80-4ab3-a8c0-19a219f2b0a6',
    },

    splash: {
      image: './assets/logo/waterways-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#4A9FD8',
    },

    android: {
      package: 'com.waterways.mobile',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.INTERNET',
      ],
      adaptiveIcon: {
        foregroundImage: './assets/logo/waterways-logo.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    ios: {
      bundleIdentifier: iosBundleIdentifier,
      icon: './assets/logo/waterways-logo.png',
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSUserNotificationUsageDescription:
          'Waterways sends optional reminders for unfinished journey drafts so you can review and submit them.',
        NSMicrophoneUsageDescription:
          'Waterways uses the microphone only while you are actively recording an observation or using voice controls during a journey.',
        NSSpeechRecognitionUsageDescription:
          'Waterways uses on-device speech recognition to detect your wake phrase and transcribe spoken observations while the app is in use.',
        NSCameraUsageDescription:
          'Waterways uses the camera when you choose to capture photos or videos to attach to an observation.',
        NSPhotoLibraryUsageDescription:
          'Waterways accesses your photo library only when you choose existing photos or videos to attach to an observation.',
        NSPhotoLibraryAddUsageDescription:
          'Waterways saves captured media to your photo library only when you explicitly choose to save it.',
        NSLocationWhenInUseUsageDescription:
          'Waterways uses your location while the app is open to tag observations with place information and improve map accuracy.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
    },

    web: {
      favicon: './assets/favicon.png',
    },

    plugins: [
      'expo-router',
      'expo-notifications',
      [
        'expo-speech-recognition',
        {
          microphonePermission:
            'Waterways uses the microphone to listen for your wake phrase and capture observation recordings while a journey is active.',
          speechRecognitionPermission:
            'Waterways uses speech recognition to detect your wake phrase and convert spoken observations to text while the app is in use.',
          androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
        },
      ],
      './plugins/withAndroidCompatibility.js',
    ],

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
