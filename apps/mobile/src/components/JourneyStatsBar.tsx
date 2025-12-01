import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface JourneyStatsBarProps {
  duration: string;
  observations: number;
  photos: number;
  videos: number;
}

const JourneyStatsBar: React.FC<JourneyStatsBarProps> = ({
  duration,
  observations,
  photos,
  videos,
}) => {
  return (
    <View style={styles.root}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{observations}</Text>
        <Text style={styles.statLabel}>Observations</Text>
      </View>

      <View style={styles.centerItem}>
        <Text style={styles.centerLabel}>Current Journey</Text>
        <Text style={styles.centerTimer}>{duration}</Text>
      </View>

      <View style={styles.rightCol}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.photosValue]}>{photos}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.videosValue]}>{videos}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  centerItem: {
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  centerTimer: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F9FAFB',
    marginTop: 4,
  },
  rightCol: {
    alignItems: 'center',
  },
  photosValue: {
    color: '#A855F7',
  },
  videosValue: {
    color: '#F59E0B',
  },
});

export default JourneyStatsBar;
