// apps/mobile/src/screens/InstructionsScreen.tsx (The main file)

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { createInstructionsScreenStyles } from '../styles/InstructionsScreen.styles';
import Accordion from '../components/instruction/Accodian';
import InstructionRow from '../components/instruction/InstructionRow';
import VoiceCommandStructure from '../components/instruction/VoiceCommandStructure';
import ObservationClassifiers from '../components/instruction/ObservationClassifiers';
import ExampleCommands from '../components/instruction/ExampleCommands';
import TipsForBestResults from '../components/instruction/TipsForBestResults';
import { useTheme } from '../contexts/ThemeContext';

const InstructionsScreen = () => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createInstructionsScreenStyles(colors), [colors]);

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

        {/* 6. Review & Navigation (General Commands) - ACCORDION */}
        <Accordion title="Navigation">
          <InstructionRow
            command="View Previous Journeys"
            description="Displays the list of previously saved journeys."
          />
          <InstructionRow
            command="View Draft Journeys"
            description="Shows any unsubmitted journeys."
          />
          <InstructionRow command="Home" description="Navigates back to the main home screen." />
          <InstructionRow
            command="Map"
            description="Opens the map view to see observations made."
          />
          <InstructionRow command="Settings" description="Opens the app settings menu." />
          <InstructionRow
            command="My Projects"
            description="Provides access to all projects you are a part of."
          />
        </Accordion>
      </View>
    </ScrollView>
  );
};

export default InstructionsScreen;
