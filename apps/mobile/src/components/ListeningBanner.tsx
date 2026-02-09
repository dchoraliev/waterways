import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/JourneyScreen.styles';

type Props = {
  text: string;
};

export default function ListeningBanner({ text }: Props) {
  return (
    <View style={styles.listeningBanner}>
      <Text style={styles.listeningText}>{text}</Text>
    </View>
  );
}
