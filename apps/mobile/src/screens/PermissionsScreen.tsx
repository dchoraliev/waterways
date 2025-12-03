// apps/mobile/src/screens/PermissionsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, MapPin, Camera as CameraIcon, CheckCircle2, Circle, Info } from 'lucide-react-native';

import * as Location from 'expo-location';
import { Camera as ExpoCamera } from 'expo-camera';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/PermissionsScreen.styles';

type PermissionState = 'prompt' | 'granted' | 'denied';
type ExpoPermissionStatus = 'undetermined' | 'granted' | 'denied';

const PERMISSIONS_ONBOARDING_KEY = 'permissions_onboarding_completed_v1';

const PermissionsScreen: React.FC = () => {
  const router = useRouter();

  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');
  const [locationPermission, setLocationPermission] = useState<PermissionState>('prompt');
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');

  const [checking, setChecking] = useState(true);
  const [skipping, setSkipping] = useState(false);

  // First-time-only logic + initial permission check
  useEffect(() => {
    const init = async () => {
      try {
        // 1) Check if onboarding already completed
        const stored = await AsyncStorage.getItem(PERMISSIONS_ONBOARDING_KEY);
        if (stored === 'true') {
          // User has already gone through permissions once → skip screen entirely
          setSkipping(true);
          router.replace('/home'); // go straight to HomeRoute
          return;
        }

        // 2) First time: check current OS permission statuses
        const loc = await Location.getForegroundPermissionsAsync();
        setLocationPermission(mapExpoStatus(loc.status));

        const audioPerm = await getRecordingPermissionsAsync();
        setMicPermission(mapExpoStatus(audioPerm.status));

        const cam = await ExpoCamera.getCameraPermissionsAsync();
        setCameraPermission(mapExpoStatus(cam.status));
      } catch (e) {
        console.log('Error checking permissions', e);
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [router]);

  const allRequiredGranted = micPermission === 'granted' && locationPermission === 'granted';

  function mapExpoStatus(status: ExpoPermissionStatus | undefined): PermissionState {
    if (!status || status === 'undetermined') return 'prompt';
    if (status === 'granted') return 'granted';
    return 'denied';
  }

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(mapExpoStatus(status));
    } catch (e) {
      console.log('Error requesting location permission', e);
    }
  };

  const requestMic = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      setMicPermission(mapExpoStatus(status));
    } catch (e) {
      console.log('Error requesting mic permission', e);
    }
  };

  const requestCamera = async () => {
    try {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setCameraPermission(mapExpoStatus(status));
    } catch (e) {
      console.log('Error requesting camera permission', e);
    }
  };

  const handleContinue = async () => {
    if (!allRequiredGranted) return;

    try {
      await AsyncStorage.setItem(PERMISSIONS_ONBOARDING_KEY, 'true');
    } catch (e) {
      console.log('Error saving permissions onboarding flag', e);
    }

    router.replace('/home'); // 👈 send them to your HomeRoute
  };

  // While we’re either skipping or still checking, show a tiny loader
  if (checking || skipping) {
    return (
      <SafeAreaView style={styles.root}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#6b7280' }}>Preparing your app…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Info size={24} />
          </View>
          <Text style={styles.title}>Enable permissions</Text>
          <Text style={styles.subtitle}>
            We use your microphone, location, and camera to capture rich observations.
          </Text>
        </View>

        {/* Location */}
        <PermissionCard
          icon={<MapPin size={20} />}
          title="Location"
          description="Needed to map your observations along the waterway."
          state={locationPermission}
          required
          onRequest={requestLocation}
          label="Foreground location"
        />

        {/* Microphone */}
        <PermissionCard
          icon={<Mic size={20} />}
          title="Microphone"
          description="Record spoken observations during your journey."
          state={micPermission}
          required
          onRequest={requestMic}
          label="Audio recording"
        />

        {/* Camera (optional) */}
        <PermissionCard
          icon={<CameraIcon size={20} />}
          title="Camera"
          description="Capture photos and short clips of your surroundings."
          state={cameraPermission}
          required={false}
          onRequest={requestCamera}
          label="Photo & video"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Microphone and location are required. Camera is optional.
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, !allRequiredGranted && styles.primaryButtonDisabled]}
            disabled={!allRequiredGranted}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---- Reusable Components ---- */

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  state: PermissionState;
  required?: boolean;
  onRequest: () => void;
  label: string;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  icon,
  title,
  description,
  state,
  required = true,
  onRequest,
  label,
}) => {
  const isGranted = state === 'granted';
  const IconComp = isGranted ? CheckCircle2 : Circle;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardIcon}>{icon}</View>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        <StatusBadge state={state} required={required} />
      </View>

      <View style={styles.cardBodyRow}>
        <View style={styles.statusIndicator}>
          <IconComp size={16} />
          <Text style={styles.statusIndicatorText}>{label}</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={onRequest}>
          <Text style={styles.actionButtonText}>{isGranted ? 'Granted' : 'Enable'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface StatusBadgeProps {
  state: PermissionState;
  required?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ state, required = true }) => {
  const isGranted = state === 'granted';
  const label = isGranted ? 'Granted' : state === 'denied' ? 'Denied' : 'Not set';

  return (
    <View
      style={[
        styles.badge,
        isGranted
          ? styles.badgeGranted
          : state === 'denied'
            ? styles.badgeDenied
            : styles.badgeNeutral,
      ]}
    >
      <Text style={styles.badgeText}>
        {label}
        {!required ? ' · Optional' : ''}
      </Text>
    </View>
  );
};

export default PermissionsScreen;
