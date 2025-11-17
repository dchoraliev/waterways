import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/TopAppBar.styles';

const TopAppBar: React.FC = () => {
  return (
    <View style={styles.root}>
      <View style={styles.logoCircle}>
        {/* placeholder for actual logo icon */}
        <Text style={styles.logoIcon}>🌊</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>WaDE</Text>
        <Text style={styles.subtitle}>Waterway Delta Explorer</Text>
      </View>
    </View>
  );
};

export default TopAppBar;
