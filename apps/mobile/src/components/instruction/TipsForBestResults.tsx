import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const TipsForBestResults = () => {
  const { colors } = useTheme();
  const tipsStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: 5,
        },
        list: {
          paddingLeft: 5,
        },
        tipItem: {
          color: colors.textMuted,
          fontSize: 16,
          marginBottom: 10,
          lineHeight: 22,
        },
      }),
    [colors]
  );

  return (
    <View style={tipsStyles.container}>
      <View style={tipsStyles.list}>
        <Text style={tipsStyles.tipItem}>
          • **Speak clearly** and at a normal pace, even in noisy conditions.
        </Text>
        <Text style={tipsStyles.tipItem}>
          • **Pause briefly** between the category and description for better recognition.
        </Text>
        <Text style={tipsStyles.tipItem}>
          • **Keep commands concise** but include key details you want to remember.
        </Text>
        <Text style={tipsStyles.tipItem}>
          • **Use location references** (clock positions, left/right bank) to make observations more
          precise.
        </Text>
        <Text style={tipsStyles.tipItem}>
          • **Add multiple classifiers** to an observation for better categorization.
        </Text>
        <Text style={tipsStyles.tipItem}>
          • If WaDE doesn&apos;t respond, wait a moment and try saying **&quot;Hey WaDE start
          recording&quot;** again.
        </Text>
      </View>
    </View>
  );
};

export default TipsForBestResults;
