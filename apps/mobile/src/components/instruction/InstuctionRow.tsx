import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InstructionRowProps {
  command: string;
  description: string;
}

const InstructionRow: React.FC<InstructionRowProps> = ({ command, description }) => (
  <View style={rowStyles.container}>
    <Text style={rowStyles.commandText}>"{command}"</Text>
    <Text style={rowStyles.descriptionText}>{description}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#1f2937', 
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8', 
  },
  commandText: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
});

export default InstructionRow;
