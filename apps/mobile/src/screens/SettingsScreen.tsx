import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/SettingsScreen.styles';

export default function SettingsScreen() {
  const handleCreateProject = () => {
    Alert.alert(
      'Coming Soon',
      'Project creation will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Manage your WaDE preferences and data
        </Text>
      </View>

      {/* Create Project Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.row}
        onPress={handleCreateProject}
      >
        <View style={styles.rowTextCol}>
          <Text style={styles.rowTitle}>Create a Project</Text>
          <Text style={styles.rowSubtitle}>
            Start organizing journeys under a research project
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Additional settings placeholder */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>
          More settings will be added here soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
