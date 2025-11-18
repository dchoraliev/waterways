import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/JourneyScreen.styles';
import PrimaryButton from '../components/form/PrimaryButton';

export interface JourneyScreenProps {
  onEndJourney: () => void;
}

const JourneyScreen: React.FC<JourneyScreenProps> = ({ onEndJourney }) => {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Journey in progress</Text>
        <Text style={styles.subtitle}>
          We&apos;re tracking your journey. You&apos;ll be able to review your
          observations at the end.
        </Text>

        {/* Placeholder for live stats / map */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current journey</Text>
          <Text style={styles.summaryItem}>Duration: 00:12:34</Text>
          <Text style={styles.summaryItem}>Observations: 3</Text>
        </View>

        <PrimaryButton
          label="End journey"
          onPress={onEndJourney}
          style={styles.endButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default JourneyScreen;
