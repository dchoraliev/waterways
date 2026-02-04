import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from '../styles/TopAppBar.styles';
import waterwaysLogo from '../../assets/logo/Waterways Logo.png';

const TopAppBar: React.FC = () => {
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
