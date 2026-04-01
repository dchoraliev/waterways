import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InstructionRowProps {
  command: string;
  description: string;
}

const InstructionRow: React.FC<InstructionRowProps> = ({ command, description }) => {
  const { colors } = useTheme();
  const rowStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: 12,
          paddingHorizontal: 15,
          borderRadius: 8,
          backgroundColor: colors.surface,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        },
        commandText: {
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 4,
        },
        descriptionText: {
          color: colors.textMuted,
          fontSize: 14,
        },
      }),
    [colors]
  );

  return (
    <View style={rowStyles.container}>
      <Text style={rowStyles.commandText}>{command}</Text>
      <Text style={rowStyles.descriptionText}>{description}</Text>
    </View>
  );
};

export default InstructionRow;
