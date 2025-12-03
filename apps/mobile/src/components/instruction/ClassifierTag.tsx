import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ClassifierTagProps {
  label: string;
  color: string;
}

const ClassifierTag: React.FC<ClassifierTagProps> = ({ label, color }) => (
  <View style={[classifierStyles.tag, { backgroundColor: color }]}>
    <Text style={classifierStyles.tagText}>{label}</Text>
  </View>
);

const classifierStyles = StyleSheet.create({
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontWeight: '500',
    color: '#1f2937',
    fontSize: 14,
  },
});

export default ClassifierTag;
