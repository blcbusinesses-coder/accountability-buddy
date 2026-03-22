import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Unified full-screen background — single gradient base, one animated overlay.
 * No partial-size layers so there are zero visible seams.
 * Using rgba(6,13,10,0) instead of 'transparent' avoids the Android black-fade artifact.
 */
export default function SceneBackground({ children }: { children: React.ReactNode }) {
  const breathe = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0.25, duration: 5000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      {/* ── Layer 1: solid base, full screen, no partial edges ── */}
      <LinearGradient
        colors={['#0c1c13', '#060d0a', '#060d0a', '#071510']}
        locations={[0, 0.28, 0.72, 1]}
        style={styles.fill}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
      />

      {/* ── Layer 2: animated breathing glow, also full screen ── */}
      <Animated.View style={[styles.fill, { opacity: breathe }]}>
        <LinearGradient
          colors={['rgba(74,255,114,0.11)', 'rgba(6,13,10,0)', 'rgba(6,13,10,0)']}
          locations={[0, 0.5, 1]}
          style={styles.fill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.7 }}
        />
      </Animated.View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
