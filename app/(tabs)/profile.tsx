import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getBestDay(tasks: Task[]): string | null {
  const completed = tasks.filter((t) => t.status === 'completed');
  if (completed.length === 0) return null;
  const counts: Record<number, number> = {};
  completed.forEach((t) => {
    const day = new Date(t.updated_at).getDay();
    counts[day] = (counts[day] ?? 0) + 1;
  });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? DAYS[parseInt(best[0])] : null;
}

function getSubmissionDNA(submissions: Submission[]): string | null {
  const approved = submissions.filter((s) => s.ai_verdict === 'approved');
  if (approved.length === 0) return null;
  const counts: Record<string, number> = {};
  approved.forEach((s) => { counts[s.submission_type] = (counts[s.submission_type] ?? 0) + 1; });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  const icons: Record<string, string> = { photo: '📸 Photo', text: '✍️ Text', audio: '🎙️ Audio' };
  return icons[best[0]] ?? best[0];
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('submissions').select('*').eq('user_id', user.id),
    ]).then(([tasksRes, subsRes]) => {
      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
    });
  }, [user]));

  const email = user?.email ?? 'Unknown';
  const initials = email.charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const resolved = completed + failed;
  const lifetimeRate = resolved > 0 ? Math.round((completed / resolved) * 100) : null;
  const bestDay = getBestDay(tasks);
  const dna = getSubmissionDNA(submissions);

  const GlassCard = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={[styles.cardInner, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );

  const StatRow = ({ icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) => (
    <View style={[styles.statRow, { borderTopColor: theme.border }]}>
      <Ionicons name={icon} size={18} color={color ?? theme.primary} />
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: color ?? theme.textPrimary }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Profile</Text>
        </View>

        {/* Avatar card */}
        <View style={styles.section}>
          <GlassCard>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryMuted, borderColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
              </View>
              <Text style={[styles.email, { color: theme.textPrimary }]}>{email}</Text>
              <Text style={[styles.memberSince, { color: theme.textSecondary }]}>Member since {memberSince}</Text>
            </View>
          </GlassCard>
        </View>

        {/* Stats insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Your Stats</Text>
          <GlassCard>
            {lifetimeRate !== null && (
              <StatRow icon="trophy-outline" label="Lifetime success rate" value={`${lifetimeRate}%`} color={lifetimeRate >= 70 ? theme.success : lifetimeRate >= 40 ? theme.warning : theme.error} />
            )}
            <StatRow icon="checkmark-circle-outline" label="Tasks completed" value={`${completed}`} color={theme.success} />
            <StatRow icon="close-circle-outline" label="Tasks failed" value={`${failed}`} color={theme.error} />
            {bestDay && (
              <StatRow icon="flash-outline" label="Most productive day" value={bestDay} />
            )}
            {dna && (
              <StatRow icon="sparkles-outline" label="Preferred proof style" value={dna} />
            )}
          </GlassCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>Accountability Buddy v1.0</Text>
          <Text style={[styles.footerSub, { color: theme.textMuted }]}>Powered by GPT-4 Vision & Supabase</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10, paddingHorizontal: 4,
  },
  card: { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  cardInner: { borderRadius: 18 },
  avatarWrap: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, marginBottom: 14,
  },
  avatarText: { fontSize: 30, fontWeight: '700' },
  email: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  memberSince: { fontSize: 13 },
  statRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1,
  },
  statLabel: { flex: 1, fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700' },
  footer: { alignItems: 'center', paddingTop: 8 },
  footerText: { fontSize: 13 },
  footerSub: { fontSize: 11, marginTop: 4 },
});
