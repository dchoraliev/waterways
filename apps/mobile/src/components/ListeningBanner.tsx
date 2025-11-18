import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

// adjust the path if you put the icons elsewhere
const micIcon = require('../assets/icons/mic.png');
const moreIcon = require('../assets/icons/more-vertical.png');

export interface ListeningBannerProps {
  label?: string;
}

const ListeningBanner: React.FC<ListeningBannerProps> = ({
  label = 'Listening for "Hey WaDE"',
}) => {
  return (
    <View style={styles.root}>
      <View style={styles.leftRow}>
        <Image source={micIcon} style={styles.micIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TouchableOpacity hitSlop={8}>
        <Image source={moreIcon} style={styles.moreIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micIcon: {
    width: 18,
    height: 18,
    tintColor: '#ECFEFF',
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    color: '#ECFEFF',
  },
  moreIcon: {
    width: 16,
    height: 16,
    tintColor: '#ECFEFF',
  },
});

export default ListeningBanner;
