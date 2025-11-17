import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles/HomeScreen.styles';

export interface HomeScreenProps {
  onStartJourney?: () => void;
  onViewRecordings?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartJourney, onViewRecordings }) => {
  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeTitle}>Welcome to WaDE</Text>
          <Text style={styles.welcomeSubtitle}>Track and explore waterway deltas</Text>
        </View>

        {/* Start a Journey */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onStartJourney}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconCirclePrimary}>
              <Text style={styles.cardIcon}>▶</Text>
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitle}>Start a Journey</Text>
              <Text style={styles.cardSubtitle}>Begin tracking a new journey</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* View Previous Recordings */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onViewRecordings}>
          <View style={styles.cardRow}>
            <View style={styles.cardIconCircleSecondary}>
              <Text style={styles.cardIcon}>⏱</Text>
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitle}>View Previous Recordings</Text>
              <Text style={styles.cardSubtitle}>Browse your journey history</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
