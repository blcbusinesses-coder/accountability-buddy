import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { Calendar } from 'react-native-calendars';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import TaskCard from '../../components/TaskCard';
import SceneBackground from '../../components/SceneBackground';
import GlassCard from '../../components/GlassCard';
import type { Database } from '../../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dots?: { color: string }[];
    selected?: boolean;
    selectedColor?: string;
  };
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_time', { ascending: true });
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]));

  const markedDates: MarkedDates = tasks.reduce<MarkedDates>((acc, task) => {
    const date = task.due_date;
    const existing = acc[date] ?? {};
    const dotColor =
      task.status === 'completed' ? theme.success :
      task.status === 'failed' ? theme.error : theme.primary;
    acc[date] = { ...existing, marked: true, dots: [...(existing.dots ?? []), { color: dotColor }] };
    return acc;
  }, {});

  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: theme.primaryMuted,
  };

  const tasksOnDate = tasks.filter((t) => t.due_date === selectedDate);

  return (
    <SceneBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary, fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32 }]}>Calendar</Text>
        </View>

        <GlassCard style={styles.calendarWrap}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: theme.textSecondary,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: '#000',
              todayTextColor: '#4AFF72',
              todayBackgroundColor: 'rgba(74,255,114,0.15)',
              dayTextColor: theme.textPrimary,
              textDisabledColor: theme.textMuted,
              dotColor: theme.primary,
              selectedDotColor: '#000',
              arrowColor: theme.primary,
              monthTextColor: theme.textPrimary,
              indicatorColor: theme.primary,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </GlassCard>

        <View style={styles.daySection}>
          <Text style={[styles.dayTitle, { color: theme.textSecondary }]}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </Text>

          {loading ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
          ) : tasksOnDate.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tasks due on this day</Text>
            </View>
          ) : (
            <FlatList
              data={tasksOnDate}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
              )}
              contentContainerStyle={{ paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { letterSpacing: -0.5 },
  calendarWrap: {
    marginHorizontal: 16, marginBottom: 12,
  },
  daySection: { flex: 1, paddingTop: 4 },
  dayTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 24 },
  emptyText: { fontSize: 14 },
});
