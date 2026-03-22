/**
 * Feature 7 — Social Proof Drip
 * Live "X proofs submitted today" indicator with count-up animation and pulse dot.
 * Shows real Supabase count. Supports `compact` prop for inline use.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SocialProofDrip({ compact }: { compact?: boolean }) {
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

      const total = todayCount ?? 0;

      Animated.timing(containerOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();

      if (total === 0) {
        setDisplayCount(0);
        return;
      }

      // Count up from 90% to 100%
      const start = Math.floor(total * 0.9);
      const steps = 20;
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
      }, 800 / steps);
    } catch {
      // Silently show 0 on error
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

  const label = displayCount === 1 ? '1 proof today' : `${displayCount.toLocaleString()} proofs today`;

  return (
    <Animated.View style={[compact ? styles.wrapperCompact : styles.wrapper, { opacity: containerOpacity }]}>
      <View style={styles.pill}>
        {/* Pulsing ring */}
        <Animated.View
          style={[styles.pulseDot, { opacity: pulseOpacity, transform: [{ scale: pulseAnim }] }]}
        />
        {/* Solid dot */}
        <View style={styles.solidDot} />
        <Text style={styles.text}>{label}</Text>
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
    // No outer margin — used inline in header/top bar
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
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Outfit_500Medium',
  },
});
