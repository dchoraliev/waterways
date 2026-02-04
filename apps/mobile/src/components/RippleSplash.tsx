import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing, type ImageSourcePropType } from 'react-native';

type RippleSplashProps = {
  size?: number; // logo box size
  color?: string; // ripple color
  backgroundColor?: string; // screen background
  source: ImageSourcePropType; // require(...) or { uri: ... }
  logoA11yLabel?: string;
};

export default function RippleSplash({
  size = 72,
  color = '#1D4ED8',
  backgroundColor = '#020617',
  source,
  logoA11yLabel = 'App logo',
}: RippleSplashProps): React.JSX.Element {
  // Lazy init: created once, no refs, lint-safe
  const [a1] = useState(() => new Animated.Value(0));
  const [a2] = useState(() => new Animated.Value(0));
  const [a3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const makeLoop = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = makeLoop(a1, 0);
    const l2 = makeLoop(a2, 300);
    const l3 = makeLoop(a3, 600);

    l1.start();
    l2.start();
    l3.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [a1, a2, a3]);

  const rippleStyle = (v: Animated.Value) => ({
    transform: [
      {
        scale: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 2.8],
        }),
      },
    ],
    opacity: v.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0.35, 0.22, 0],
    }),
  });

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <View style={[styles.rippleWrap, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: color, width: size, height: size, borderRadius: 16 },
            rippleStyle(a1),
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: color, width: size, height: size, borderRadius: 16 },
            rippleStyle(a2),
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            { backgroundColor: color, width: size, height: size, borderRadius: 16 },
            rippleStyle(a3),
          ]}
        />

        <View
          style={[
            styles.logoBox,
            {
              width: size,
              height: size,
              borderRadius: 16,
              backgroundColor: color,
            },
          ]}
        >
          <Image
            source={source}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel={logoA11yLabel}
            accessible
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '60%',
    height: '60%',
  },
});
