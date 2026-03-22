/**
 * Feature 8 — Productivity Battery (redesigned)
 * Vertical 5-bar battery with staggered fill animation.
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

  // Weighted: recent 3 days get 1.3x multiplier
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

  // Animated values for each bar (staggered bottom-up fill)
  const barAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  // Low battery pulse
  const lowPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered fill animation: bottom bar (index 4) fills first
    const anims = barAnims.map((anim, i) => {
      const barIndex = 4 - i; // reverse: fill from bottom up
      const shouldFill = barIndex < bars;
      return Animated.sequence([
        Animated.delay(barIndex * 60),
        Animated.timing(anim, {
          toValue: shouldFill ? 1 : 0,
          duration: 120,
          useNativeDriver: false,
        }),
      ]);
    });
    Animated.parallel(anims).start();

    // Low battery pulse if 0 bars
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
          {/* Battery nub */}
          <View style={[styles.batteryNub, { backgroundColor: theme.borderStrong }]} />
          {/* Battery body */}
          <View style={[styles.batteryBody, { borderColor: theme.borderStrong }]}>
            {/* 5 bars, rendered top to bottom (bar 0 = top = bar 5 visual) */}
            {Array.from({ length: 5 }, (_, i) => {
              const barSlot = 4 - i; // 4=top, 0=bottom
              const shouldBeFilled = barSlot < bars;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      backgroundColor: barAnims[barSlot].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255,255,255,0.06)', barColor],
                      }),
                      opacity: bars === 0 ? lowPulse : 1,
                    },
                    i < 4 && styles.barGap,
                  ]}
                />
              );
            })}
          </View>
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
          <View style={[styles.popover, { backgroundColor: theme.surfaceStrong, borderColor: theme.borderStrong }]}>
            <Text style={[styles.popTitle, { color: theme.textPrimary }]}>Productivity Battery</Text>

            <View style={styles.pctRow}>
              <Text style={[styles.pctBig, { color: barColor }]}>{pct}%</Text>
              <Text style={[styles.pctLabel, { color: theme.textSecondary }]}>
                last 7 days
              </Text>
            </View>

            {/* 7-day bar chart */}
            <View style={styles.chart}>
              {sevenDayData.map((d, i) => {
                const barH = d.total > 0 ? (d.completed / maxDayCount) * 48 : 4;
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.chartBarWrap}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: barH,
                            backgroundColor: d.completed > 0 ? barColor : theme.surfaceElevated,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDay, { color: theme.textMuted }]}>{d.day}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.closePopover, { backgroundColor: theme.surfaceElevated }]}
              onPress={() => setPopoverVisible(false)}
            >
              <Text style={[styles.closePopoverText, { color: theme.textSecondary }]}>Close</Text>
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
    padding: 4,
  },
  batteryContainer: {
    alignItems: 'center',
  },
  batteryNub: {
    width: 16,
    height: 5,
    borderRadius: 2,
    marginBottom: 2,
  },
  batteryBody: {
    width: 44,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    padding: 4,
    justifyContent: 'space-between',
    gap: 3,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
  },
  barGap: {
    marginBottom: 0,
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
  popTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pctBig: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pctLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 68,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    minHeight: 4,
    borderRadius: 3,
  },
  chartDay: {
    fontSize: 10,
    fontWeight: '600',
  },
  closePopover: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closePopoverText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
