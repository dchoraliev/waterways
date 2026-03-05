import React, { useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { createTopAppBarStyles } from '../styles/TopAppBar.styles';
import waterwaysLogo from '../../assets/logo/waterways-logo.png';
import { useTheme } from '../contexts/ThemeContext';

const TopAppBar: React.FC = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createTopAppBarStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <View style={styles.logoImage}>
        {/* placeholder for actual logo icon */}
        <Image source={waterwaysLogo} style={styles.logoImage} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>WaDE</Text>
        <Text style={styles.subtitle}>Waterway Delta Explorer</Text>
      </View>
    </View>
  );
};

export default TopAppBar;
