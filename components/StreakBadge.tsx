/**
 * Feature 2 — Streak Mechanic (enhanced)
 * Green flame pill with flicker animation, idle green glow pulse, milestone rings, toast.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  // Idle green background pulse
  const idlePulse = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(10)).current;
  const prevStreak = useRef(-1);

  // Flame flicker loop
  useEffect(() => {
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 1.2, duration: 550, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 0.92, duration: 380, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1.12, duration: 480, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1600),
      ])
    );
    flicker.start();
    return () => flicker.stop();
  }, []);

  // Idle green glow pulse — slow 2.2s per phase
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
      ? ['rgba(74,255,114,0.14)', 'rgba(74,255,114,0.30)']
      : ['rgba(74,255,114,0.07)', 'rgba(74,255,114,0.18)'],
  });

  const animatedBorder = idlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: isMilestone
      ? ['rgba(74,255,114,0.30)', 'rgba(74,255,114,0.60)']
      : ['rgba(74,255,114,0.12)', 'rgba(74,255,114,0.32)'],
  });

  return (
    <View style={styles.container}>
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}>
          <Text style={styles.toastText}>🔥 {streak}-day milestone!</Text>
        </Animated.View>
      )}

      <View style={styles.badgeWrap}>
        {/* Milestone ring pulse */}
        <Animated.View
          style={[styles.milestoneRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <Animated.View
          style={[styles.badge, { backgroundColor: animatedBg, borderColor: animatedBorder }]}
        >
          {/* Green flame icon with flicker */}
          <Animated.View style={{ transform: [{ scale: flickerAnim }] }}>
            <Ionicons name="flame" size={14} color="#4AFF72" />
          </Animated.View>
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
    borderColor: '#4AFF72',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4AFF72',
    fontFamily: 'Outfit_700Bold',
  },
  milestoneText: {
    fontSize: 14,
    color: '#4AFF72',
  },
  toast: {
    position: 'absolute',
    top: -36,
    left: 0,
    backgroundColor: 'rgba(74,255,114,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 100,
  },
  toastText: { color: '#4AFF72', fontSize: 12, fontWeight: '700' },
});
