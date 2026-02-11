import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/HomeScreen.styles';

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
  return (
    <View style={styles.root}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Welcome to WaDE</Text>
        <Text style={styles.subtitle}>Track and explore waterway deltas</Text>

        {/* Start Journey */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onStartJourney}>
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>▶</Text>
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>Start a Journey</Text>
            <Text style={styles.cardSubtitle}>Begin tracking a new journey</Text>
          </View>
        </TouchableOpacity>

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
