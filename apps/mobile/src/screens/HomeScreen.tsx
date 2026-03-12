import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createHomeScreenStyles } from '../styles/HomeScreen.styles';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { useRouter } from 'expo-router';

export interface HomeScreenProps {
  onStartJourney: () => void;
  onViewRecordings: () => void;
  onViewDrafts: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartJourney,
  onViewRecordings,
  onViewDrafts,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { permissions } = usePermissions();
  const styles = useMemo(() => createHomeScreenStyles(colors), [colors]);

  const canStartJourney = permissions.allGranted;

  const handleStartJourney = () => {
    if (!canStartJourney) {
      // Redirect to permissions screen
      router.push('/permissions');
      return;
    }
    onStartJourney();
  };

  return (
    <View style={styles.root}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Welcome to WaDE</Text>
        <Text style={styles.subtitle}>Track and explore waterway deltas</Text>

        {/* Start Journey */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.card, !canStartJourney && { opacity: 0.5 }]}
          onPress={handleStartJourney}
        >
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>▶</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Start a Journey</Text>
            <Text style={styles.cardSubtitle}>
              {canStartJourney
                ? 'Begin tracking a new journey'
                : 'Grant permissions to start a journey'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Permissions warning banner */}
        {!canStartJourney && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primary + '15',
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.primary + '40',
            }}
            onPress={() => router.push('/permissions')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 4,
                  }}
                >
                  Permissions Required
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  Tap to grant camera, microphone, and location access
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* View previous journeys */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onViewRecordings}>
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>⏱</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>View Previous Journeys</Text>
            <Text style={styles.cardSubtitle}>Browse your journey history</Text>
          </View>
        </TouchableOpacity>

        {/* View draft journeys */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onViewDrafts}>
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>📄</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>View Draft Journeys</Text>
            <Text style={styles.cardSubtitle}>Review and submit saved journeys</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
