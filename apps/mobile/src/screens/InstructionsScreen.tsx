// apps/mobile/src/screens/InstructionsScreen.tsx (The main file)

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Accordion from '../components/instruction/Accodian';
import InstructionRow from '../components/instruction/InstuctionRow';
import VoiceCommandStructure from '../components/instruction/VoiceCommandStructure';
import ObservationClassifiers from '../components/instruction/ObservationClassifiers';
import ExampleCommands from '../components/instruction/ExampleCommands';
import TipsForBestResults from '../components/instruction/TipsForBestResults';

const InstructionsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Main Header */}
        <Text style={styles.mainTitle}>Voice Command Guide 🎙️</Text>
        <Text style={styles.description}>
          Operate the app hands-free during your journey using the commands below. Speak clearly and
          wait for the confirmation tone.
        </Text>

        {/* 1. How It Works (Voice Command Structure) - ACCORDION */}
        <Accordion title="How It Works" isDefaultOpen={true}>
          <VoiceCommandStructure />
        </Accordion>

        {/* 2. Example Commands - ACCORDION */}
        <Accordion title="Example Commands">
          <ExampleCommands />
        </Accordion>

        {/* 3. Observation Classifiers - ACCORDION */}
        <Accordion title="Observation Classifiers">
          <ObservationClassifiers />
        </Accordion>

        {/* 4. Tips for Best Results - ACCORDION */}
        <Accordion title="Tips for Best Results">
          <TipsForBestResults />
        </Accordion>

        {/* 5. Recording Control (General Commands) - ACCORDION */}
        <Accordion title="Recording Control">
          <InstructionRow
            command="Start journey"
            description="Begins a new recording session and tracking."
          />
          <InstructionRow
            command="Pause recording"
            description="Temporarily stops tracking and time measurement."
          />
          <InstructionRow
            command="Resume tracking"
            description="Continues the paused recording session."
          />
          <InstructionRow
            command="End journey"
            description="Stops and saves the current trip recording."
          />
        </Accordion>

        {/* 6. Review & Navigation (General Commands) - ACCORDION */}
        <Accordion title="Review & Navigation">
          <InstructionRow
            command="Show history"
            description="Displays the list of previously saved journeys."
          />
          <InstructionRow command="Go home" description="Navigates back to the main home screen." />
        </Accordion>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 15,
  },
  content: {
    paddingVertical: 20,
    paddingBottom: 50,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 20,
  },
});

export default InstructionsScreen;
