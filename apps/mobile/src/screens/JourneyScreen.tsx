import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createObservation } from '../database/ObservationManager';
import { updateTripById } from '../database/TripManager';

import ListeningBanner from '../components/ListeningBanner';
import PrimaryButton from '../components/form/PrimaryButton';
import styles from '../styles/JourneyScreen.styles';

export interface JourneyScreenProps {
  tripId: string;
}

const JourneyScreen: React.FC<JourneyScreenProps> = ({ tripId }) => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  const handleStartListening = () => {
    setIsListening(true);
    console.log('Start listening for trip:', tripId);
    // TODO: start GPS/audio tracking here and associate with tripId
  };

  const handleStopListening = () => {
    setIsListening(false);
    console.log('Stop listening for trip:', tripId);
    // TODO: stop GPS/audio tracking here
  };

  const handleAddObservation = () => {
    // Temporary placeholder implementation
    const userId = 'local-user';
    const tempObservation = 'Test observation ' + Date.now();
    createObservation({ user_id: userId, trip_id: tripId, observation: tempObservation });
    console.log('Add observation for trip:', tripId, 'observation:', tempObservation);
  };

  const handleEndJourney = () => {
    // End the journey and navigate to review screen
    updateTripById(tripId, { end_time: Date.now() });
    console.log('Ended journey for trip:', tripId);
    setIsListening(false);
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

        {/* Temporary placeholder buttons for observation addition action */}
        <PrimaryButton
          label="Add Observation (TEMP)"
          onPress={handleAddObservation}
          style={styles.primaryButton}
        />

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
