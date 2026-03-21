import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import TaskCard from '../../components/TaskCard';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

type FilterType = 'all' | 'pending' | 'completed' | 'failed';

export default function TasksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      // Auto-fail overdue pending tasks
      const now = new Date();
      const updated: Task[] = [];
      const toFail: string[] = [];

      for (const task of data as Task[]) {
        if (task.status === 'pending') {
          const due = new Date(`${task.due_date}T${task.due_time}`);
          if (due < now) {
            toFail.push(task.id);
            updated.push({ ...task, status: 'failed' });
          } else {
            updated.push(task);
          }
        } else {
          updated.push(task);
        }
      }

      if (toFail.length > 0) {
        await supabase
          .from('tasks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .in('id', toFail);
      }

      setTasks(updated);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user, filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks();
    }, [fetchTasks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const FilterPill = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[styles.filterPill, filter === type && styles.filterPillActive]}
      onPress={() => setFilter(type)}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterPillText, filter === type && styles.filterPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Tasks</Text>
          <Text style={styles.sub}>
            {stats.pending} pending · {stats.completed} done
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/task/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: Colors.border }]}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.successMuted }]}>
          <Text style={[styles.statNum, { color: Colors.success }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.primaryMuted }]}>
          <Text style={[styles.statNum, { color: Colors.primaryLight }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderColor: Colors.errorMuted }]}>
          <Text style={[styles.statNum, { color: Colors.error }]}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        <FilterPill type="all" label="All" />
        <FilterPill type="pending" label="Pending" />
        <FilterPill type="completed" label="Completed" />
        <FilterPill type="failed" label="Failed" />
      </View>

      {/* Task list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyText}>
                Tap the + button to create your first task.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1,
  },
  statNum: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterPillTextActive: { color: Colors.primaryLight },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
