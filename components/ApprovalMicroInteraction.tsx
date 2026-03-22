/**
 * Feature 4 — Satisfying Micro-Interaction on Task Approval
 * Sequence: glow flash → animated checkmark → particle burst → card slide-off → haptic
 */
import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Vibration } from 'react-native';

const ACCENT = '#4AFF72';
const PARTICLE_COUNT = 14;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  angle: number;
}

interface Props {
  onComplete?: () => void;
}

export default function ApprovalMicroInteraction({ onComplete }: Props) {
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      angle: (i / PARTICLE_COUNT) * 2 * Math.PI,
    }))
  ).current;

  useEffect(() => {
    // Haptic first
    Vibration.vibrate(40);

    // 1. Glow flash (0–120ms)
    Animated.sequence([
      Animated.timing(glowOpacity, {
        toValue: 1, duration: 80, useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }),
    ]).start();

    // 2. Checkmark draws in (120–420ms)
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1, duration: 120, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Particles burst (at ~260ms)
    particles.forEach((p) => {
      const dist = 55 + Math.random() * 30;
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.spring(p.scale, {
            toValue: 1, tension: 200, friction: 6, useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 1, duration: 80, useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: Math.cos(p.angle) * dist,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: Math.sin(p.angle) * dist,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(p.opacity, {
              toValue: 0, duration: 200, useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });

    // 4. Card shrinks and slides off (at ~450ms)
    Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(cardScale, {
          toValue: 0.88, duration: 180, useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: -30, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0, duration: 220, useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onComplete?.();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
        },
      ]}
    >
      {/* Warm white glow */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity },
        ]}
      />

      {/* Checkmark */}
      <Animated.View
        style={[
          styles.checkWrap,
          {
            opacity: checkOpacity,
            transform: [{ scale: checkScale }],
          },
        ]}
      >
        <View style={styles.checkCircle}>
          {/* Custom checkmark drawn with rotated views */}
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkShort} />
            <View style={styles.checkLong} />
          </View>
        </View>
      </Animated.View>

      {/* Particles */}
      <View style={styles.particlesAnchor} pointerEvents="none">
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkShort: {
    position: 'absolute',
    left: 5,
    bottom: 11,
    width: 10,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    right: 3,
    bottom: 9,
    width: 18,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
    transform: [{ rotate: '-50deg' }],
  },
  particlesAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    marginLeft: -4,
    marginTop: -4,
  },
});
