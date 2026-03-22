/**
 * Feature 7 — Social Proof Drip
 * Live-style "X proofs submitted today" indicator with count-up and pulse dot.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SocialProofDrip() {
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
      // Get today's submission count from supabase
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count: todayCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Add a base number to make it feel active even on early use
      const total = (todayCount ?? 0) + 847;
      setCount(total);

      // Animate in the container
      Animated.timing(containerOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();

      // Count up animation from 90% to 100%
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
      // Fallback to a realistic number
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
          Animated.timing(pulseAnim, {
            toValue: 1.8, duration: 800, useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0, duration: 800, useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1, duration: 0, useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1, duration: 0, useNativeDriver: true,
          }),
        ]),
        Animated.delay(1200),
      ])
    ).start();
  };

  const formatted = displayCount.toLocaleString();

  return (
    <Animated.View style={[styles.wrapper, { opacity: containerOpacity }]}>
      <View style={styles.pill}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulseDot,
            {
              opacity: pulseOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        {/* Solid red dot */}
        <View style={styles.solidDot} />
        <Text style={styles.text}>
          <Text style={styles.count}>{formatted}</Text>
          {' '}proofs submitted today
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    gap: 8,
  },
  pulseDot: {
    position: 'absolute',
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF453A',
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF453A',
  },
  text: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  count: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
});
