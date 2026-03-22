/**
 * Feature 9 — Weekly Recap
 * Scrollable highlight reel of the week's completed tasks with proof rendered inline.
 * Accessible from profile tab. Auto-shown on Sundays at 7pm (checked on app open).
 */
import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

interface Submission {
  id: string;
  task_id: string;
  submission_type: 'photo' | 'text' | 'audio';
  content_url: string | null;
  text_content: string | null;
  ai_verdict: string;
  created_at: string;
}

interface RecapTask {
  id: string;
  title: string;
  updated_at: string;
  submission: Submission | null;
}

function getWeekRange() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export default function RecapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<RecapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadRecap();
    }, [user])
  );

  const loadRecap = async () => {
    if (!user) return;
    setLoading(true);

    const weekStart = getWeekRange();

    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('updated_at', weekStart.toISOString())
      .order('updated_at', { ascending: false });

    if (!completedTasks) {
      setLoading(false);
      return;
    }

    // Fetch submissions for each task
    const recapItems: RecapTask[] = await Promise.all(
      completedTasks.map(async (task) => {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('task_id', task.id)
          .eq('ai_verdict', 'approved')
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          id: task.id,
          title: task.title,
          updated_at: task.updated_at,
          submission: subs?.[0] ?? null,
        };
      })
    );

    setTasks(recapItems);
    setLoading(false);
  };

  // Stats
  const totalCompleted = tasks.length;

  const byDay: Record<string, number> = {};
  tasks.forEach((t) => {
    const day = new Date(t.updated_at).toDateString();
    byDay[day] = (byDay[day] || 0) + 1;
  });
  const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const bestDayStr = bestDay
    ? `${new Date(bestDay[0]).toLocaleDateString('en', { weekday: 'short' })} (${bestDay[1]})`
    : '—';

  // Streak this week
  let weekStreak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (byDay[d.toDateString()]) weekStreak++;
    else if (i > 0) break;
  }

  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.surfaceElevated }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Weekly Recap</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {new Date().toLocaleDateString('en', { month: 'long', day: 'numeric' })} week
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats pills */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{totalCompleted}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Completed</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statNum, { color: '#FFD60A' }]}>{weekStreak}d</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Streak</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statNum, { color: theme.textPrimary }]}>{bestDayStr}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Best Day</Text>
            </View>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={52} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
                No completions yet this week
              </Text>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Complete tasks and they'll appear here as your highlight reel.
              </Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => (
                <View
                  key={task.id}
                  style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  {/* Task header */}
                  <View style={styles.taskHeader}>
                    <View style={[styles.checkIcon, { backgroundColor: theme.successMuted }]}>
                      <Ionicons name="checkmark" size={14} color={theme.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskDay, { color: theme.textMuted }]}>
                        {formatDay(task.updated_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Proof inline */}
                  {task.submission && (
                    <View style={styles.proofSection}>
                      {task.submission.submission_type === 'photo' && task.submission.content_url && (
                        <Image
                          source={{ uri: task.submission.content_url }}
                          style={styles.proofPhoto}
                          resizeMode="cover"
                        />
                      )}
                      {task.submission.submission_type === 'text' && task.submission.text_content && (
                        <View style={[styles.proofTextWrap, { backgroundColor: theme.surfaceElevated }]}>
                          <Text style={[styles.quoteMarks, { color: theme.primary }]}>"</Text>
                          <Text style={[styles.proofText, { color: theme.textSecondary }]}>
                            {task.submission.text_content}
                          </Text>
                          <Text style={[styles.quoteMarksClose, { color: theme.primary }]}>"</Text>
                        </View>
                      )}
                      {task.submission.submission_type === 'audio' && (
                        <View style={[styles.audioProof, { backgroundColor: theme.surfaceElevated }]}>
                          <Ionicons name="mic" size={16} color={theme.primary} />
                          <Text style={[styles.audioProofText, { color: theme.textSecondary }]}>
                            Audio proof submitted
                          </Text>
                          {/* Waveform graphic */}
                          <View style={styles.waveform}>
                            {Array.from({ length: 18 }, (_, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.waveBar,
                                  {
                                    height: 4 + Math.sin(i * 0.8) * 10 + 8,
                                    backgroundColor: theme.primary,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {tasks.length > 0 && (
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>
                {totalCompleted} proof{totalCompleted !== 1 ? 's' : ''} accepted this week 🏆
              </Text>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: '500' },
  taskList: { gap: 12 },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  checkIcon: {
    width: 28, height: 28, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  taskTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  taskDay: { fontSize: 11, marginTop: 2 },
  proofSection: { paddingHorizontal: 14, paddingBottom: 14 },
  proofPhoto: {
    width: '100%', height: 160, borderRadius: 12,
  },
  proofTextWrap: {
    borderRadius: 12, padding: 12,
    position: 'relative',
  },
  quoteMarks: { fontSize: 28, fontWeight: '800', lineHeight: 28, marginBottom: 4 },
  quoteMarksClose: {
    fontSize: 28, fontWeight: '800', lineHeight: 14,
    textAlign: 'right', marginTop: 4,
  },
  proofText: { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  audioProof: {
    borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  audioProofText: { fontSize: 12, flex: 1 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  footer: { alignItems: 'center', paddingTop: 24 },
  footerText: { fontSize: 13 },
});
