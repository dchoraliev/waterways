// apps/mobile/src/components/ListeningBanner.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from '../styles/ListeningBanner.styles';
import micIcon from '../assets/icons/mic.png';
import moreIcon from '../assets/icons/more-vertical.png';

interface ListeningBannerProps {
  isListening: boolean;
  onStopListening: () => void;
}

const ListeningBanner: React.FC<ListeningBannerProps> = ({ isListening, onStopListening }) => {
  if (!isListening) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.leftRow}>
        <Image source={micIcon} style={styles.icon} />
        <View>
          <Text style={styles.title}>Listening...</Text>
          <Text style={styles.subtitle}>Say &quot;Hey WaDE&quot; to add an observation</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.moreButton} onPress={onStopListening}>
        <Image source={moreIcon} style={styles.moreIcon} />
      </TouchableOpacity>
    </View>
  );
};

export default ListeningBanner;
