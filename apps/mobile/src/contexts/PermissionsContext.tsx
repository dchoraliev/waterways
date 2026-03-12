import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { requestForegroundPermissionsAsync } from 'expo-location';
import { Linking } from 'react-native';

export interface PermissionsStatus {
  camera: boolean;
  microphone: boolean;
  location: boolean;
  allGranted: boolean;
}

interface PermissionsContextValue {
  permissions: PermissionsStatus;
  checkAllPermissions: () => Promise<void>;
  requestAllPermissions: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export const PermissionsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [cameraPermission, requestCamera] = useCameraPermissions();
  const [micPermission, requestMic] = useMicrophonePermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAllPermissions = useCallback(async () => {
    setLoading(true);
    try {
      // Check location separately since it's not a hook
      const locStatus = await requestForegroundPermissionsAsync();
      setLocationGranted(locStatus.granted);
    } catch (error) {
      console.error('[Permissions] Failed to check location:', error);
      setLocationGranted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      // Request all permissions
      const [camResult, micResult, locResult] = await Promise.all([
        requestCamera(),
        requestMic(),
        requestForegroundPermissionsAsync(),
      ]);

      setLocationGranted(locResult.granted);

      const allGranted = camResult.granted && micResult.granted && locResult.granted;

      return allGranted;
    } catch (error) {
      console.error('[Permissions] Failed to request permissions:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [requestCamera, requestMic]);

  const openSettings = useCallback(async () => {
    try {
      // Works on both iOS and Android
      await Linking.openSettings();
    } catch (error) {
      console.error('[Permissions] Failed to open settings:', error);
    }
  }, []);

  const permissions: PermissionsStatus = {
    camera: cameraPermission?.granted ?? false,
    microphone: micPermission?.granted ?? false,
    location: locationGranted,
    allGranted:
      (cameraPermission?.granted ?? false) && (micPermission?.granted ?? false) && locationGranted,
  };

  const value: PermissionsContextValue = {
    permissions,
    checkAllPermissions,
    requestAllPermissions,
    openSettings,
    loading,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return ctx;
}
