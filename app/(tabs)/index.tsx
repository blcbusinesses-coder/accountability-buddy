import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated,
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
import SocialProofDrip from '../../components/SocialProofDrip';
import SceneBackground from '../../components/SceneBackground';
import GlassCard from '../../components/GlassCard';
import type { Database } from '../../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type FilterType = 'all' | 'pending' | 'completed' | 'failed';

/**
 * Staggered fade+slide-up entrance for each task card.
 * Delay is index * 55ms so cards cascade from top to bottom.
 */
function AnimatedCard({ index, children }: { index: number; children: React.ReactNode }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 55),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Stats row entrance animation
  const statsAnim = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(statsAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(statsSlide, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

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
      // Reset stats entrance animation each time screen focuses
      statsAnim.setValue(0);
      statsSlide.setValue(-8);
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
          active && {
            backgroundColor: theme.primaryMuted,
            shadowColor: '#4AFF72',
            shadowRadius: 8,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Text style={[styles.pillText, { color: active ? theme.primary : theme.textSecondary, fontFamily: 'Outfit_600SemiBold' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const StatCard = ({
    value, label, color, tint,
  }: { value: number; label: string; color: string; tint?: 'green' | 'red' | 'neutral' }) => (
    <GlassCard tint={tint ?? 'neutral'} style={styles.statCardGlass}>
      <View style={styles.statCardInner}>
        <Text style={[styles.statNum, { color, fontFamily: 'Outfit_700Bold' }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted, fontFamily: 'Outfit_500Medium' }]}>{label}</Text>
      </View>
    </GlassCard>
  );

  return (
    <SceneBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>

        {/* ── Header Row 1: Title + Add button ── */}
        <View style={styles.headerRow1}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular' }]}>
            My Tasks
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, {
              backgroundColor: theme.primary,
              shadowColor: '#4AFF72',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 20,
              shadowOpacity: 0.5,
              elevation: 8,
            }]}
            onPress={() => router.push('/task/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ── Header Row 2: Streak | Battery | Social Proof stat bar ── */}
        <View style={styles.headerRow2}>
          <StreakBadge tasks={allTasks} />
          <View style={styles.headerRow2Center}>
            {allTasks.length > 0 && <ProductivityBattery tasks={allTasks} />}
          </View>
          <SocialProofDrip compact />
        </View>

        {/* Stats row — slides in after data loads */}
        <Animated.View style={[
          styles.statsRow,
          { opacity: statsAnim, transform: [{ translateY: statsSlide }] },
        ]}>
          <StatCard value={stats.total} label="Total" color={theme.textPrimary} />
          <StatCard value={stats.completed} label="Done" color={theme.success} tint="green" />
          <StatCard value={stats.pending} label="Pending" color={theme.primary} />
          <StatCard value={stats.failed} label="Failed" color={theme.error} tint="red" />
        </Animated.View>

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
            renderItem={({ item, index }) => (
              <AnimatedCard index={index}>
                <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
              </AnimatedCard>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchTasks(); }}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={56}
                  color={theme.textMuted}
                  style={{ shadowColor: '#4AFF72', shadowRadius: 16, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } }}
                />
                <Text style={[styles.emptyTitle, { color: theme.textSecondary, fontFamily: 'Outfit_600SemiBold' }]}>
                  No tasks yet
                </Text>
                <Text style={[styles.emptyText, { color: theme.textMuted, fontFamily: 'Outfit_500Medium' }]}>
                  Tap + to create your first task
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header Row 1
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: { fontSize: 32, letterSpacing: -0.5 },
  addBtn: {
    width: 44, height: 44, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },

  // Header Row 2 — stat bar
  headerRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 10,
  },
  headerRow2Center: {
    flex: 1,
    alignItems: 'center',
  },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  statCardGlass: { flex: 1 },
  statCardInner: { padding: 12, alignItems: 'center' },
  statNum: { fontSize: 20, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, marginTop: 2 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1 },
  pillText: { fontSize: 13 },

  listContent: { paddingTop: 4, paddingBottom: 140 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
