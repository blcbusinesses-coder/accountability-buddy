import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar } from 'react-native-calendars';
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

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    dots?: { color: string }[];
    selected?: boolean;
    selectedColor?: string;
  };
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const router = useRouter();
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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTasks();
    }, [fetchTasks])
  );

  const markedDates: MarkedDates = tasks.reduce<MarkedDates>((acc, task) => {
    const date = task.due_date;
    const existing = acc[date] ?? {};
    const dots = existing.dots ?? [];
    const dotColor =
      task.status === 'completed' ? Colors.success :
      task.status === 'failed' ? Colors.error : Colors.primaryLight;

    acc[date] = {
      ...existing,
      marked: true,
      dots: [...dots, { color: dotColor }],
    };
    return acc;
  }, {});

  // Highlight selected
  if (markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: Colors.primaryMuted,
    };
  } else {
    markedDates[selectedDate] = { selected: true, selectedColor: Colors.primaryMuted };
  }

  const tasksOnDate = tasks.filter(t => t.due_date === selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: Colors.background,
          calendarBackground: Colors.surface,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: '#fff',
          todayTextColor: Colors.primaryLight,
          dayTextColor: Colors.textPrimary,
          textDisabledColor: Colors.textMuted,
          dotColor: Colors.primary,
          selectedDotColor: '#fff',
          arrowColor: Colors.primaryLight,
          monthTextColor: Colors.textPrimary,
          indicatorColor: Colors.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* Tasks for selected date */}
      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : tasksOnDate.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks due on this day</Text>
          </View>
        ) : (
          <FlatList
            data={tasksOnDate}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  calendar: {
    borderRadius: 16, marginHorizontal: 16, marginVertical: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  daySection: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  dayTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 24 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
