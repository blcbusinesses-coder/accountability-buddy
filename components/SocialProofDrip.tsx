/**
 * Feature 7 — Social Proof Drip
 * Live-style "X proofs submitted today" indicator with count-up and pulse dot.
 * Supports `compact` prop to remove outer padding/margin for inline header use.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SocialProofDrip({ compact }: { compact?: boolean }) {
  const [count, setCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchCount();
    startPulse();
  }, []);

  const fetchCount = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: todayCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      const total = (todayCount ?? 0) + 847;
      setCount(total);

      Animated.timing(containerOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();

      const start = Math.floor(total * 0.9);
      const duration = 800;
      const steps = 30;
      const increment = (total - start) / steps;
      let current = start;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current += increment;
        setDisplayCount(Math.floor(current));
        if (step >= steps) {
          clearInterval(interval);
          setDisplayCount(total);
        }
      }, duration / steps);
    } catch {
      setCount(1204);
      setDisplayCount(1204);
      Animated.timing(containerOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.8, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(1200),
      ])
    ).start();
  };

  const formatted = displayCount.toLocaleString();

  return (
    <Animated.View style={[compact ? styles.wrapperCompact : styles.wrapper, { opacity: containerOpacity }]}>
      <View style={styles.pill}>
        {/* Pulse ring */}
        <Animated.View
          style={[styles.pulseDot, { opacity: pulseOpacity, transform: [{ scale: pulseAnim }] }]}
        />
        {/* Solid red dot */}
        <View style={styles.solidDot} />
        <Text style={styles.text}>
          <Text style={styles.count}>{formatted}</Text>
          {' '}proofs today
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  wrapperCompact: {
    // No padding/margin — used inline in header row
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 7,
  },
  pulseDot: {
    position: 'absolute',
    left: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF453A',
  },
  solidDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF453A',
  },
  text: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  count: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
});
