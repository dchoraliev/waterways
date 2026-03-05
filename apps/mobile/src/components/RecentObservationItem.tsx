import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { createRecentObservationItemStyles } from '../styles/RecentObservationItem.styles';
import { useTheme } from '../contexts/ThemeContext';

export type RecentObservationItemProps = {
  title: string;
  subtitle?: string; // ✅ add this
  onPress: () => void;
};

export function RecentObservationItem({ title, subtitle, onPress }: RecentObservationItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createRecentObservationItemStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? { opacity: 0.85 } : null]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {/* no icons/fonts */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
