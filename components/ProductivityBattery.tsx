/**
 * Feature 8 — Productivity Battery (horizontal, header-scale)
 * Sits to the left of the + button in the main header row.
 * 5 horizontal segments, left-to-right staggered fill animation.
 * Tap to expand glass popover with exact % and 7-day bar chart.
 */
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface Props {
  tasks: Task[];
}

function computeBatteryBars(tasks: Task[]): { bars: number; pct: number } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recent = tasks.filter((t) => new Date(t.updated_at) >= sevenDaysAgo);
  if (recent.length === 0) return { bars: 0, pct: 0 };

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);

  let weightedCompleted = 0;
  let weightedTotal = 0;

  recent.forEach((t) => {
    const isRecent = new Date(t.updated_at) >= threeDaysAgo;
    const weight = isRecent ? 1.3 : 1.0;
    if (t.status === 'completed') weightedCompleted += weight;
    if (t.status === 'completed' || t.status === 'failed') weightedTotal += weight;
  });

  const rawPct = weightedTotal > 0 ? (weightedCompleted / weightedTotal) * 100 : 50;
  const pct = Math.min(100, Math.round(rawPct));
  const bars = Math.round((pct / 100) * 5);
  return { bars, pct };
}

function getBarColor(bars: number): string {
  if (bars >= 5) return '#4AFF72';
  if (bars >= 3) return '#FFD60A';
  if (bars >= 1) return '#FF8E53';
  return '#FF453A';
}

function get7DayData(tasks: Task[]): { day: string; completed: number; total: number }[] {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const dayTasks = tasks.filter((t) => new Date(t.updated_at).toDateString() === dateStr);
    days.push({
      day: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1),
      completed: dayTasks.filter((t) => t.status === 'completed').length,
      total: dayTasks.length,
    });
  }
  return days;
}

export default function ProductivityBattery({ tasks }: Props) {
  const { theme } = useTheme();
  const { bars, pct } = computeBatteryBars(tasks);
  const barColor = getBarColor(bars);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const sevenDayData = get7DayData(tasks);

  // Animated values for each bar (staggered left-to-right fill)
  const barAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  const lowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anims = barAnims.map((anim, i) => {
      const shouldFill = i < bars;
      return Animated.sequence([
        Animated.delay(i * 70),
        Animated.timing(anim, {
          toValue: shouldFill ? 1 : 0,
          duration: 140,
          useNativeDriver: false,
        }),
      ]);
    });
    Animated.parallel(anims).start();

    if (bars === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lowPulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(lowPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [bars]);

  const maxDayCount = Math.max(1, ...sevenDayData.map((d) => d.total));

  return (
    <>
      <TouchableOpacity
        onPress={() => setPopoverVisible(true)}
        activeOpacity={0.75}
        style={styles.wrapper}
      >
        <View style={styles.batteryContainer}>
          {/* Battery body — same borderRadius and height weight as the + button */}
          <View style={[styles.batteryBody, { borderColor: theme.borderStrong }]}>
            {Array.from({ length: 5 }, (_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  i < 4 && { marginRight: 3 },
                  {
                    backgroundColor: barAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255,255,255,0.08)', barColor],
                    }),
                    opacity: bars === 0 ? lowPulse : 1,
                  },
                ]}
              />
            ))}
          </View>
          {/* Nub on the right */}
          <View style={[styles.batteryNub, { backgroundColor: theme.borderStrong }]} />
        </View>
      </TouchableOpacity>

      {/* Popover modal */}
      <Modal
        visible={popoverVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopoverVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPopoverVisible(false)}
        >
          <View style={[styles.popover, { backgroundColor: '#000000', borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={[styles.popTitle, { color: theme.textPrimary, fontFamily: 'Outfit_700Bold' }]}>
              Productivity Battery
            </Text>

            <View style={styles.pctRow}>
              <Text style={[styles.pctBig, { color: barColor, fontFamily: 'Outfit_700Bold' }]}>{pct}%</Text>
              <Text style={[styles.pctLabel, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>
                last 7 days
              </Text>
            </View>

            <View style={styles.chart}>
              {sevenDayData.map((d, i) => {
                const barH = d.total > 0 ? (d.completed / maxDayCount) * 48 : 4;
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.chartBarWrap}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: barH, backgroundColor: d.completed > 0 ? barColor : 'rgba(255,255,255,0.10)' },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDay, { color: theme.textMuted, fontFamily: 'Outfit_600SemiBold' }]}>
                      {d.day}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.closePopover, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
              onPress={() => setPopoverVisible(false)}
            >
              <Text style={[styles.closePopoverText, { color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit_600SemiBold' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Match the + button's visual weight: borderRadius 13, height 38
  batteryBody: {
    width: 88,
    height: 38,
    borderRadius: 13,
    borderWidth: 1.5,
    padding: 5,
    flexDirection: 'row',
  },
  batteryNub: {
    width: 5,
    height: 16,
    borderRadius: 2,
    marginLeft: 3,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  popover: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  popTitle: { fontSize: 16, letterSpacing: -0.3 },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pctBig: { fontSize: 40, letterSpacing: -1 },
  pctLabel: { fontSize: 13 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 68 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarWrap: { flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  chartBar: { width: '80%', minHeight: 4, borderRadius: 3 },
  chartDay: { fontSize: 10 },
  closePopover: { borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  closePopoverText: { fontSize: 14 },
});
