import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import TaskCard from '../../components/TaskCard';
import ProductivityBattery from '../../components/ProductivityBattery';
import StreakBadge from '../../components/StreakBadge';
import type { Database } from '../../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type FilterType = 'all' | 'pending' | 'completed' | 'failed';

// Fetch ALL tasks (unfiltered) for battery/streak, apply UI filter separately
export default function TasksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true });

    if (!error && data) {
      const now = new Date();
      const toFail: string[] = [];
      const updated: Task[] = (data as Task[]).map((task) => {
        if (task.status === 'pending') {
          const due = new Date(`${task.due_date}T${task.due_time}`);
          if (due < now) {
            toFail.push(task.id);
            return { ...task, status: 'failed' as const };
          }
        }
        return task;
      });

      if (toFail.length > 0) {
        await supabase
          .from('tasks')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .in('id', toFail);
      }

      setAllTasks(updated);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks();
    }, [fetchTasks])
  );

  const filteredTasks = filter === 'all' ? allTasks : allTasks.filter((t) => t.status === filter);

  const stats = {
    total: allTasks.length,
    completed: allTasks.filter((t) => t.status === 'completed').length,
    pending: allTasks.filter((t) => t.status === 'pending').length,
    failed: allTasks.filter((t) => t.status === 'failed').length,
  };

  const FilterPill = ({ type, label }: { type: FilterType; label: string }) => {
    const active = filter === type;
    return (
      <TouchableOpacity
        onPress={() => setFilter(type)}
        activeOpacity={0.7}
        style={[
          styles.pill,
          { borderColor: active ? theme.primary : theme.border },
          active && { backgroundColor: theme.primaryMuted },
        ]}
      >
        <Text style={[styles.pillText, { color: active ? theme.primary : theme.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const StatCard = ({
    value, label, color,
  }: { value: number; label: string; color: string }) => (
    <View style={[styles.statCard, { borderColor: theme.border }]}>
      <View style={[styles.statCardInner, { backgroundColor: theme.surface }]}>
        <Text style={[styles.statNum, { color }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>My Tasks</Text>
          <StreakBadge tasks={allTasks} />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/task/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard value={stats.total} label="Total" color={theme.textPrimary} />
        <StatCard value={stats.completed} label="Done" color={theme.success} />
        <StatCard value={stats.pending} label="Pending" color={theme.primary} />
        <StatCard value={stats.failed} label="Failed" color={theme.error} />
      </View>

      {/* Productivity Battery */}
      {allTasks.length > 0 && <ProductivityBattery tasks={allTasks} />}

      {/* Filter pills */}
      <View style={styles.filterRow}>
        <FilterPill type="all" label="All" />
        <FilterPill type="pending" label="Pending" />
        <FilterPill type="completed" label="Done" />
        <FilterPill type="failed" label="Failed" />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTasks(); }} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No tasks yet</Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Tap + to create your first task
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1,
  },
  statCardInner: { padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingTop: 4, paddingBottom: 120 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
