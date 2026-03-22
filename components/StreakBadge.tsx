/**
 * Feature 2 — Streak Mechanic (enhanced)
 * Flame pill with flicker animation, idle amber glow pulse, milestone pulse rings, toast on milestone.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface Props {
  tasks: Task[];
}

const MILESTONES = [3, 7, 14, 30];

export function computeStreak(tasks: Task[]): number {
  const completedDates = tasks
    .filter((t) => t.status === 'completed' && t.updated_at)
    .map((t) => new Date(t.updated_at).toDateString());

  const uniqueDates = new Set(completedDates);
  if (uniqueDates.size === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (uniqueDates.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function StreakBadge({ tasks }: Props) {
  const streak = computeStreak(tasks);

  const flickerAnim = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  // Idle amber background pulse (useNativeDriver: false for color interpolation)
  const idlePulse = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(10)).current;
  const prevStreak = useRef(-1);

  // Flame flicker loop
  useEffect(() => {
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 1.18, duration: 550, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 0.94, duration: 380, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1.1, duration: 480, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1600),
      ])
    );
    flicker.start();
    return () => flicker.stop();
  }, []);

  // Idle amber background pulse — slow 2.2s per phase
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(idlePulse, { toValue: 1, duration: 2200, useNativeDriver: false }),
        Animated.timing(idlePulse, { toValue: 0, duration: 2200, useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Milestone detection
  useEffect(() => {
    if (prevStreak.current === -1) {
      prevStreak.current = streak;
      return;
    }
    const isMilestoneHit = MILESTONES.includes(streak) && streak > prevStreak.current;
    if (isMilestoneHit) {
      ringScale.setValue(0.8);
      ringOpacity.setValue(0.9);
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 2.8, duration: 700, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();

      setShowToast(true);
      toastY.setValue(10);
      toastOpacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(toastY, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(2800),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowToast(false));
    }
    prevStreak.current = streak;
  }, [streak]);

  if (streak === 0) return null;

  const isMilestone = MILESTONES.includes(streak);

  const animatedBg = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: isMilestone
      ? ['rgba(255,214,10,0.20)', 'rgba(255,214,10,0.40)']
      : ['rgba(255,214,10,0.09)', 'rgba(255,214,10,0.24)'],
  });

  const animatedBorder = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: isMilestone
      ? ['rgba(255,214,10,0.35)', 'rgba(255,214,10,0.65)']
      : ['rgba(255,214,10,0.14)', 'rgba(255,214,10,0.38)'],
  });

  return (
    <View style={styles.container}>
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
          <Text style={styles.toastText}>🔥 {streak}-day milestone!</Text>
        </Animated.View>
      )}

      <View style={styles.badgeWrap}>
        <Animated.View
          style={[styles.milestoneRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: animatedBg, borderColor: animatedBorder },
          ]}
        >
          <Animated.Text style={[styles.fire, { transform: [{ scale: flickerAnim }] }]}>
            🔥
          </Animated.Text>
          <Text style={[styles.text, isMilestone && styles.milestoneText]}>{streak}d</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start' },
  badgeWrap: { alignItems: 'center', justifyContent: 'center' },
  milestoneRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFD60A',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 3,
  },
  fire: { fontSize: 13 },
  text: { fontSize: 13, fontWeight: '700', color: '#FFD60A' },
  milestoneText: { fontSize: 14, color: '#FFD60A' },
  toast: {
    position: 'absolute',
    top: -36,
    left: 0,
    backgroundColor: 'rgba(255,214,10,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 100,
  },
  toastText: { color: '#FFD60A', fontSize: 12, fontWeight: '700' },
});
