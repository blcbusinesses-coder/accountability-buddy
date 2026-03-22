import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SceneBackground({ children }: { children: React.ReactNode }) {
  // Two glow layers alternate opacity for a slow breathing/drift effect
  const breatheA = useRef(new Animated.Value(1)).current;
  const breatheB = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breatheA, { toValue: 0.3, duration: 5000, useNativeDriver: true }),
          Animated.timing(breatheB, { toValue: 1, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(breatheA, { toValue: 1, duration: 5000, useNativeDriver: true }),
          Animated.timing(breatheB, { toValue: 0.3, duration: 5000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      {/* Base: deep black-green */}
      <View style={[styles.absolute, { backgroundColor: '#060d0a' }]} />

      {/* Breathing layer A: top-left green glow */}
      <Animated.View style={[styles.absolute, styles.topLeft, { opacity: breatheA }]}>
        <LinearGradient
          colors={['rgba(74,255,114,0.13)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Breathing layer B: shifted top-center glow (alternates with A) */}
      <Animated.View style={[styles.absolute, styles.topCenter, { opacity: breatheB }]}>
        <LinearGradient
          colors={['rgba(74,255,114,0.09)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.9, y: 0.7 }}
        />
      </Animated.View>

      {/* Static: top-right subtle teal accent */}
      <LinearGradient
        colors={['rgba(0,200,150,0.06)', 'transparent']}
        style={[styles.absolute, styles.topRight]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Static: bottom center deep forest depth */}
      <LinearGradient
        colors={['transparent', 'rgba(20,80,60,0.18)']}
        style={[styles.absolute, styles.bottomCenter]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  absolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topLeft: { width: '75%', height: '50%', top: 0, left: 0 },
  topCenter: { width: '80%', height: '50%', top: 0, left: '10%' },
  topRight: { width: '50%', height: '40%', top: 0, right: 0 },
  bottomCenter: { height: '55%', bottom: 0 },
});
