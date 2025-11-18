import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

export interface TagPillProps {
  label: string;
  style?: StyleProp<ViewStyle>;
}

const TagPill: React.FC<TagPillProps> = ({ label, style }) => {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#4C1D95', // purple-ish
    marginRight: 8,
    marginTop: 6,
  },
  text: {
    fontSize: 11,
    color: '#F9FAFB',
    fontWeight: '500',
  },
});

export default TagPill;
