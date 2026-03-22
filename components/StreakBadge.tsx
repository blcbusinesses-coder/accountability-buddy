import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface Props {
  tasks: Task[];
}

function computeStreak(tasks: Task[]): number {
  const completedDates = tasks
    .filter((t) => t.status === 'completed')
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
  const { theme } = useTheme();
  const streak = computeStreak(tasks);

  if (streak === 0) return null;

  return (
    <View style={[styles.badge, { backgroundColor: 'rgba(255,214,10,0.12)', borderColor: 'rgba(255,214,10,0.2)' }]}>
      <Text style={styles.fire}>🔥</Text>
      <Text style={[styles.text, { color: '#FFD60A' }]}>{streak}d</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  fire: { fontSize: 13 },
  text: { fontSize: 13, fontWeight: '700' },
});
