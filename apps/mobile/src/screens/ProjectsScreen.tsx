import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createProjectsScreenStyles } from '../styles/ProjectsScreen.styles';
import { useTheme } from '../contexts/ThemeContext';

const ProjectsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createProjectsScreenStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.title}>Projects</Text>
        <Text style={styles.subtitle}>
          This page will be implemented in a future version of WaDE.
        </Text>
        <Text style={styles.note}>
          You&apos;ll be able to create, join and manage research projects here.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ProjectsScreen;
