import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles/SettingsScreen.styles';


interface SettingsScreenProps {
  onNavigateToProjects?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigateToProjects }) => {
  const handleMyProjects = () => {
    onNavigateToProjects?.();
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your WaDE preferences and data.</Text>
      </View>

      {/* My Projects entry */}
      <TouchableOpacity activeOpacity={0.85} style={styles.row} onPress={handleMyProjects}>
        <View style={styles.rowTextCol}>
          <Text style={styles.rowTitle}>My Projects</Text>
          <Text style={styles.rowSubtitle}>
            View and manage your research projects.
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Placeholder for future settings */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>More settings will be available here soon.</Text>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;
