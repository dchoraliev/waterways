import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';

import { updateTripById } from '../database/TripManager';
import { getCurrentCoordinates } from '../services/LocationService';
import { transcribeTripAudio } from '../services/TranscriptionService';
import { saveAudioObservationForTrip } from '../services/VoiceRecorder';

import ListeningBanner from '../components/ListeningBanner';
import PrimaryButton from '../components/form/PrimaryButton';
import styles from '../styles/JourneyScreen.styles';
import { createObservation } from '../database/ObservationManager';

export interface JourneyScreenProps {
  tripId: string;
}

const JourneyScreen: React.FC<JourneyScreenProps> = ({ tripId }) => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  const USER_ID = 'local-user'; // TODO: replace with real auth user id
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Configure audio + request mic permission once
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Microphone permission', 'Permission to access the microphone was denied.');
          return;
        }

        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (e) {
        console.error('[JourneyScreen] Error configuring audio', e);
      }
    })();
  }, []);

  const handleStartListening = async () => {
    try {
      console.log('Start listening for trip:', tripId);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsListening(true);
    } catch (err) {
      console.error('[JourneyScreen] Error starting recording', err);
      Alert.alert('Recording error', 'Could not start recording audio.');
    }
  };

  const handleStopListening = async () => {
    try {
      console.log('Stop listening for trip:', tripId);
      await audioRecorder.stop();
      setIsListening(false);

      const uri = audioRecorder.uri;
      if (!uri) {
        console.warn('[JourneyScreen] No recording URI after stop');
        return;
      }

      // Save this clip as an observation linked to this trip
      await saveAudioObservationForTrip(tripId, USER_ID, uri);
    } catch (err) {
      console.error('[JourneyScreen] Error stopping recording', err);
      Alert.alert('Recording error', 'Could not stop recording audio.');
    }
  };

  const handleAddObservation = async () => {
    // Temporary placeholder implementation
    const userId = 'local-user';
    const tempObservation = 'Test observation ' + Date.now();
    const coordinates = await getCurrentCoordinates();
    await createObservation({
      user_id: userId,
      trip_id: tripId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      observation: tempObservation,
    });
    console.log(
      'Add observation for trip:',
      tripId,
      'observation:',
      tempObservation,
      'coordinates:',
      coordinates
    );
  };

  const handleEndJourney = async () => {
    try {
      // If still recording, stop and save the last clip
      if (isListening) {
        await handleStopListening();
      }

      // Mark trip as ended
      const coordinates = await getCurrentCoordinates();
      await updateTripById(tripId, {
        end_time: Date.now(),
        end_latitude: coordinates.latitude,
        end_longitude: coordinates.longitude,
      });
      console.log('Ended journey for trip:', tripId, coordinates);

      // Transcribe all untranscribed audio clips for this trip
      await transcribeTripAudio(tripId);
      console.log('[JourneyScreen] Triggered transcription for trip:', tripId);

      // Go to review
      router.push(`/review/${tripId}`);
    } catch (err) {
      console.error('[JourneyScreen] Error ending journey', err);
      Alert.alert(
        'Journey error',
        'Something went wrong while ending the journey. You can review later from the home screen.'
      );
      // Still navigate, so the user can see what was saved
      router.push(`/review/${tripId}`);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ListeningBanner isListening={isListening} onStopListening={handleStopListening} />

      <View style={styles.content}>
        <Text style={styles.title}>Journey in progress</Text>
        <Text style={styles.subtitle}>Record observations while traveling along the waterway.</Text>

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

        {/* TEMP button only to add test observation*/}
        <PrimaryButton
          label="Add Observation (TEMP)"
          onPress={handleAddObservation}
          style={styles.secondaryButton}
        />

        {/* You can remove this TEMP button once you're happy with audio */}
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
