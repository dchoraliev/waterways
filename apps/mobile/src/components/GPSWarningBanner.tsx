import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GPSQuality } from '../services/LocationService';

interface GPSWarningBannerProps {
  quality: GPSQuality;
  usingDeadReckoning: boolean;
  onDismiss?: () => void;
}

export const GPSWarningBanner: React.FC<GPSWarningBannerProps> = ({
  quality,
  usingDeadReckoning,
  onDismiss,
}) => {
  // Don't show banner if GPS is good
  if (quality === GPSQuality.GOOD && !usingDeadReckoning) {
    return null;
  }

  const getMessage = () => {
    if (usingDeadReckoning) {
      return {
        icon: 'navigate' as const,
        title: 'Using Motion Sensors',
        description: 'GPS signal is weak. Location estimated using device motion.',
        color: '#F59E0B',
      };
    }

    if (quality === GPSQuality.POOR) {
      return {
        icon: 'warning' as const,
        title: 'Poor GPS Signal',
        description: 'Location accuracy may be reduced. Try moving to an open area.',
        color: '#EF4444',
      };
    }

    // Medium quality
    return {
      icon: 'information-circle' as const,
      title: 'Moderate GPS Signal',
      description: 'Location accuracy is reduced. Consider improving GPS signal.',
      color: '#F59E0B',
    };
  };

  const config = getMessage();

  return (
    <View style={[styles.container, { backgroundColor: config.color + '15' }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '30' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
