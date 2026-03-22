import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface Props {
  tasks: Task[];
}

function getBatteryLabel(pct: number): string {
  if (pct >= 90) return '⚡ Fully charged';
  if (pct >= 70) return '🟢 Running strong';
  if (pct >= 50) return '🔵 Steady pace';
  if (pct >= 30) return '🟡 Needs a win';
  return '🔴 Recharge now';
}

function getLast30Days(tasks: Task[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return tasks.filter((t) => new Date(t.updated_at) >= cutoff);
}

export default function ProductivityBattery({ tasks }: Props) {
  const { theme } = useTheme();

  const recent = getLast30Days(tasks);
  const completed = recent.filter((t) => t.status === 'completed').length;
  const failed = recent.filter((t) => t.status === 'failed').length;
  const resolved = completed + failed;
  const pct = resolved > 0 ? Math.round((completed / resolved) * 100) : 50;
  const label = getBatteryLabel(pct);

  const fillColor =
    pct >= 70 ? theme.success :
    pct >= 40 ? theme.warning :
    theme.error;

  return (
    <View style={[styles.wrapper, { borderColor: theme.border }]}>
      <View style={[styles.inner, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Productivity Battery</Text>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          </View>
          <Text style={[styles.pct, { color: fillColor }]}>{pct}%</Text>
        </View>

        {/* Battery bar */}
        <View style={[styles.track, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
          {/* Battery tip */}
          <View style={[styles.tip, { backgroundColor: theme.borderStrong }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={[styles.stat, { color: theme.textMuted }]}>
            <Text style={{ color: theme.success }}>{completed}</Text> done
          </Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>
            <Text style={{ color: theme.error }}>{failed}</Text> failed
          </Text>
          <Text style={[styles.stat, { color: theme.textMuted }]}>last 30 days</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  inner: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  left: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, marginBottom: 2 },
  label: { fontSize: 12 },
  pct: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  track: {
    height: 10,
    borderRadius: 10,
    overflow: 'visible',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
  tip: {
    position: 'absolute',
    right: -5,
    width: 5,
    height: 6,
    borderRadius: 2,
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12 },
});
