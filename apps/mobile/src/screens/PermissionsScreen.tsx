import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePermissions } from '../contexts/PermissionsContext';
import { useTheme } from '../contexts/ThemeContext';

export default function PermissionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { permissions, requestAllPermissions, openSettings, checkAllPermissions, loading } =
    usePermissions();
  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  // If all permissions granted, navigate to home
  useEffect(() => {
    if (permissions.allGranted) {
      router.replace('/');
    }
  }, [permissions.allGranted, router]);

  const handleRequestPermissions = async () => {
    setHasRequestedOnce(true);
    const granted = await requestAllPermissions();

    if (granted) {
      router.replace('/');
    }
  };

  const handleOpenSettings = async () => {
    await openSettings();
  };

  const missingPermissions = [];
  if (!permissions.camera) missingPermissions.push('Camera');
  if (!permissions.microphone) missingPermissions.push('Microphone');
  if (!permissions.location) missingPermissions.push('Location');

  const showSettingsButton = hasRequestedOnce && !permissions.allGranted;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.iconText}>🔒</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Permissions Required</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Waterways needs access to your device&apos;s camera, microphone, and location to record
          observations.
        </Text>

        {/* Permission Cards */}
        <View style={styles.permissionsList}>
          <PermissionCard
            icon="📷"
            title="Camera"
            description="Take photos and videos of your observations"
            granted={permissions.camera}
            colors={colors}
          />
          <PermissionCard
            icon="🎙️"
            title="Microphone"
            description="Record audio observations during your journey"
            granted={permissions.microphone}
            colors={colors}
          />
          <PermissionCard
            icon="📍"
            title="Location"
            description="Track your journey path and observation locations"
            granted={permissions.location}
            colors={colors}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!showSettingsButton ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermissions}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Grant Permissions</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleOpenSettings}
              >
                <Text style={styles.primaryButtonText}>Open Settings</Text>
              </TouchableOpacity>

              <Text style={[styles.settingsHint, { color: colors.textMuted }]}>
                Some permissions were denied. Please enable {missingPermissions.join(', ')} in your
                device settings.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PermissionCardProps {
  icon: string;
  title: string;
  description: string;
  granted: boolean;
  colors: {
    surface: string;
    textPrimary: string;
    textMuted: string;
  };
}

function PermissionCard({ icon, title, description, granted, colors }: PermissionCardProps) {
  return (
    <View style={[styles.permissionCard, { backgroundColor: colors.surface }]}>
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionIcon}>{icon}</Text>
        <View style={styles.permissionTitleContainer}>
          <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>{title}</Text>
          {granted && (
            <View style={[styles.grantedBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.grantedText}>✓ Granted</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.permissionDescription, { color: colors.textMuted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  permissionsList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  permissionCard: {
    borderRadius: 12,
    padding: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  permissionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  grantedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  grantedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
