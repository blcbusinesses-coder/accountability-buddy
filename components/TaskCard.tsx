import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

type Props = {
  task: Task;
  onPress: () => void;
};

function formatDueDate(date: string, time: string): string {
  const due = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return 'Overdue';
  if (diffHours < 1) return `${Math.round(diffMs / 60000)}m left`;
  if (diffHours < 24) return `${Math.round(diffHours)}h left`;

  const days = Math.floor(diffHours / 24);
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days}d left`;

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusStyle(status: Task['status'], isOverdue: boolean) {
  if (status === 'completed') return { icon: 'checkmark-circle' as const, color: Colors.success, bg: Colors.successMuted };
  if (status === 'failed') return { icon: 'close-circle' as const, color: Colors.error, bg: Colors.errorMuted };
  if (isOverdue) return { icon: 'alert-circle' as const, color: Colors.warning, bg: Colors.warningMuted };
  return { icon: 'time-outline' as const, color: Colors.primaryLight, bg: Colors.primaryMuted };
}

export default function TaskCard({ task, onPress }: Props) {
  const due = new Date(`${task.due_date}T${task.due_time}`);
  const isOverdue = due < new Date() && task.status === 'pending';
  const timeLabel = formatDueDate(task.due_date, task.due_time);
  const statusStyle = getStatusStyle(task.status, isOverdue);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.statusDot, { backgroundColor: statusStyle.bg }]}>
        <Ionicons name={statusStyle.icon} size={18} color={statusStyle.color} />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            task.status === 'completed' && styles.titleDone,
            task.status === 'failed' && styles.titleFailed,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={12} color={isOverdue ? Colors.warning : Colors.textMuted} />
          <Text style={[styles.dueLabel, isOverdue && styles.dueLabelOverdue]}>{timeLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  statusDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  titleDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  titleFailed: {
    color: Colors.error,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dueLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dueLabelOverdue: {
    color: Colors.warning,
    fontWeight: '500',
  },
});
