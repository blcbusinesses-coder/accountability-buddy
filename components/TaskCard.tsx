import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import type { Database } from '../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

function formatDueDate(dueDate: string, dueTime: string): string {
  const due = new Date(`${dueDate}T${dueTime}`);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Overdue';
  if (diffMins < 60) return `${diffMins}m left`;
  if (diffMins < 1440) return `${Math.round(diffMins / 60)}h left`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (due.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  const days = Math.round(diffMins / 1440);
  if (days < 7) return `${days}d left`;

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusConfig(task: Task) {
  const isOverdue =
    task.status === 'pending' &&
    new Date(`${task.due_date}T${task.due_time}`) < new Date();

  if (isOverdue) {
    return { icon: 'alert-circle' as const, color: '#FFD60A', bg: 'rgba(255,214,10,0.12)' };
  }
  switch (task.status) {
    case 'completed':
      return { icon: 'checkmark-circle' as const, color: '#00E5A0', bg: 'rgba(0,229,160,0.12)' };
    case 'failed':
      return { icon: 'close-circle' as const, color: '#FF453A', bg: 'rgba(255,69,58,0.12)' };
    default:
      return { icon: 'time-outline' as const, color: '#00E5A0', bg: 'rgba(0,229,160,0.10)' };
  }
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const { theme } = useTheme();
  const { icon, color, bg } = getStatusConfig(task);
  const dimmed = task.status === 'completed' || task.status === 'failed';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.wrapper}>
      <View style={[styles.inner, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.title, { color: theme.textPrimary, opacity: dimmed ? 0.45 : 1 }]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={11} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {formatDueDate(task.due_date, task.due_time)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
