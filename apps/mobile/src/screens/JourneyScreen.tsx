import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ListeningBanner from '../components/ListeningBanner';
import PrimaryButton from '../components/form/PrimaryButton';
import styles from '../styles/JourneyScreen.styles';

const JourneyScreen: React.FC = () => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  const handleStartListening = () => {
    setIsListening(true);
    // TODO: start GPS/audio tracking here
  };

  const handleStopListening = () => {
    setIsListening(false);
    // TODO: stop GPS/audio tracking here
  };

  const handleEndJourney = () => {
    setIsListening(false);
    // TODO: use real trip id from DB/context
    const tripId = 'sample-trip';
    router.push(`/review/${tripId}`);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Listening banner at the top */}
      <ListeningBanner isListening={isListening} onStopListening={handleStopListening} />

      <View style={styles.content}>
        <Text style={styles.title}>Journey in progress</Text>
        <Text style={styles.subtitle}>Record observations while traveling along the waterway.</Text>

        {/* Primary action: start / pause listening */}
        {!isListening ? (
          <PrimaryButton
            label="Start listening"
            onPress={handleStartListening}
            style={styles.primaryButton}
          />
        ) : (
          <PrimaryButton
            label="Pause listening"
            onPress={handleStopListening}
            style={styles.primaryButton}
          />
        )}

        {/* Secondary action: end journey and go to review */}
        <PrimaryButton
          label="End journey"
          onPress={handleEndJourney}
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default JourneyScreen;
