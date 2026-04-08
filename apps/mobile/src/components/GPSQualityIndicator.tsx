import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GPSQuality } from '../services/LocationService';

interface GPSQualityIndicatorProps {
  quality: GPSQuality;
  accuracy: number | null;
  usingDeadReckoning: boolean;
  showDetails?: boolean;
}

export const GPSQualityIndicator: React.FC<GPSQualityIndicatorProps> = ({
  quality,
  accuracy,
  usingDeadReckoning,
  showDetails = false,
}) => {
  const getQualityConfig = () => {
    if (usingDeadReckoning) {
      return {
        color: '#F59E0B',
        icon: 'navigate-outline' as const,
        label: 'Dead Reckoning',
        description: 'Using motion sensors',
      };
    }

    switch (quality) {
      case GPSQuality.GOOD:
        return {
          color: '#10B981',
          icon: 'radio-outline' as const,
          label: 'Good GPS',
          description: accuracy ? `±${accuracy.toFixed(1)}m` : 'Excellent signal',
        };
      case GPSQuality.MEDIUM:
        return {
          color: '#F59E0B',
          icon: 'radio-outline' as const,
          label: 'Medium GPS',
          description: accuracy ? `±${accuracy.toFixed(1)}m` : 'Moderate signal',
        };
      case GPSQuality.POOR:
      default:
        return {
          color: '#EF4444',
          icon: 'radio-outline' as const,
          label: 'Poor GPS',
          description: accuracy ? `±${accuracy.toFixed(1)}m` : 'Weak signal',
        };
    }
  };

  const config = getQualityConfig();

  if (!showDetails) {
    // Compact mode - just the indicator dot
    return (
      <View style={styles.compact}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
      </View>
    );
  }

  // Detailed mode - full indicator with text
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.description}>{config.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compact: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
