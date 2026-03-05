import React, { useEffect, useMemo, useState } from 'react';
import { Text, Animated } from 'react-native';
import { createJourneyScreenStyles } from '../styles/JourneyScreen.styles';
import { useTheme } from '../contexts/ThemeContext';

export type ListeningBannerState = 'idle' | 'listening' | 'detected' | 'recording';

type Props = {
  text: string;
  state?: ListeningBannerState;
  partialTranscript?: string | null;
  showAnimation?: boolean;
};

export default function ListeningBanner({
  text,
  state = 'idle',
  partialTranscript,
  showAnimation = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createJourneyScreenStyles(colors), [colors]);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [glowAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (showAnimation && (state === 'listening' || state === 'detected')) {
      // Pulse animation for listening state
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: false, // Changed to false to avoid conflicts
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        pulseAnim.setValue(1);
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [showAnimation, state, pulseAnim]);

  useEffect(() => {
    if (state === 'detected') {
      // Quick glow flash when wake word detected
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [state, glowAnim]);

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.success, colors.primary],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.primary],
  });

  return (
    <Animated.View
      style={[
        styles.listeningBanner,
        {
          transform: [{ scale: pulseAnim }],
          backgroundColor,
          borderWidth: 2,
          borderColor,
        },
      ]}
    >
      <Text style={styles.listeningText}>{text}</Text>
      {partialTranscript ? (
        <Text style={styles.listeningTranscript} numberOfLines={2}>
          {partialTranscript}
        </Text>
      ) : null}
    </Animated.View>
  );
}
