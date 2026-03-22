import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import type { Database } from '../../lib/supabase';

type Task = Database['public']['Tables']['tasks']['Row'];
type Submission = Database['public']['Tables']['submissions']['Row'];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) fetchTask(); }, [id]);

  const fetchTask = async () => {
    const [taskRes, subsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('id', id).single(),
      supabase.from('submissions').select('*').eq('task_id', id).order('submitted_at', { ascending: false }),
    ]);
    if (taskRes.data) setTask(taskRes.data as Task);
    if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(true);
        await supabase.from('submissions').delete().eq('task_id', id);
        await supabase.from('tasks').delete().eq('id', id);
        router.back();
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ActivityIndicator color={theme.primary} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  if (!task) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Text style={[styles.notFound, { color: theme.textSecondary }]}>Task not found</Text>
    </SafeAreaView>
  );

  const dueDate = new Date(`${task.due_date}T${task.due_time}`);
  const isOverdue = dueDate < new Date() && task.status === 'pending';
  const canSubmit = task.status === 'pending' && !isOverdue;

  const statusConfig = {
    pending: { label: 'Pending', color: theme.primary, bg: theme.primaryMuted, icon: 'time-outline' as const },
    completed: { label: 'Completed', color: theme.success, bg: theme.successMuted, icon: 'checkmark-circle' as const },
    failed: { label: 'Failed', color: theme.error, bg: theme.errorMuted, icon: 'close-circle' as const },
  }[task.status];

  const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.glassCard, { borderColor: theme.border }, style]}>
      <View style={[styles.glassCardInner, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>Task Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} disabled={deleting}>
          {deleting
            ? <ActivityIndicator color={theme.error} size="small" />
            : <Ionicons name="trash-outline" size={20} color={theme.error} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon} size={15} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>

        {/* Title + desc */}
        <Text style={[styles.taskTitle, { color: theme.textPrimary }]}>{task.title}</Text>
        {task.description && (
          <Text style={[styles.taskDesc, { color: theme.textSecondary }]}>{task.description}</Text>
        )}

        {/* Due date card */}
        <GlassCard style={{ marginBottom: 16 }}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Due Date</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Due Time</Text>
              <Text style={[styles.infoValue, { color: isOverdue ? theme.warning : theme.textPrimary }]}>
                {dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {isOverdue ? '  · Overdue' : ''}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Submit proof button */}
        {canSubmit && (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push({ pathname: '/task/submit', params: { taskId: id, taskTitle: task.title, taskDescription: task.description ?? '' } })}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={20} color="#000" />
            <Text style={styles.submitBtnText}>Submit Proof of Completion</Text>
          </TouchableOpacity>
        )}

        {/* Overdue notice */}
        {isOverdue && (
          <View style={[styles.overdueCard, { backgroundColor: theme.warningMuted, borderColor: theme.warning + '44' }]}>
            <Ionicons name="alert-circle" size={18} color={theme.warning} />
            <Text style={[styles.overdueText, { color: theme.warning }]}>This task is overdue and will be marked as failed.</Text>
          </View>
        )}

        {/* Submissions */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Submissions ({submissions.length})
        </Text>

        {submissions.length === 0 ? (
          <Text style={[styles.noSubs, { color: theme.textMuted }]}>No submissions yet.</Text>
        ) : (
          submissions.map((sub) => (
            <GlassCard key={sub.id} style={{ marginBottom: 10 }}>
              <View style={styles.subHeader}>
                <View style={[styles.typeBadge, {
                  backgroundColor: sub.submission_type === 'photo' ? 'rgba(96,165,250,0.12)' :
                    sub.submission_type === 'audio' ? 'rgba(167,139,250,0.12)' : theme.surfaceElevated,
                }]}>
                  <Ionicons
                    name={sub.submission_type === 'photo' ? 'camera' : sub.submission_type === 'audio' ? 'mic' : 'document-text'}
                    size={13}
                    color={sub.submission_type === 'photo' ? '#60a5fa' : sub.submission_type === 'audio' ? '#a78bfa' : theme.textSecondary}
                  />
                  <Text style={[styles.typeText, { color: theme.textSecondary }]}>{sub.submission_type}</Text>
                </View>
                <View style={[styles.verdictBadge, {
                  backgroundColor: sub.ai_verdict === 'approved' ? theme.successMuted :
                    sub.ai_verdict === 'rejected' ? theme.errorMuted : theme.surfaceElevated,
                }]}>
                  <Text style={[styles.verdictText, {
                    color: sub.ai_verdict === 'approved' ? theme.success :
                      sub.ai_verdict === 'rejected' ? theme.error : theme.textMuted,
                  }]}>
                    {sub.ai_verdict ?? 'Pending'}
                  </Text>
                </View>
              </View>
              {sub.ai_reasoning && (
                <Text style={[styles.reasoning, { color: theme.textSecondary }]}>{sub.ai_reasoning}</Text>
              )}
              {sub.text_content && (
                <Text style={[styles.textContent, { color: theme.textMuted }]}>"{sub.text_content}"</Text>
              )}
              <Text style={[styles.subTime, { color: theme.textMuted }]}>
                {new Date(sub.submitted_at).toLocaleString()}
              </Text>
            </GlassCard>
          ))
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  scroll: { padding: 16 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 14,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  taskTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginBottom: 8 },
  taskDesc: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  glassCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 0 },
  glassCardInner: { padding: 16, borderRadius: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '500' },
  infoDivider: { height: 1, marginVertical: 12 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, padding: 16, gap: 10, marginBottom: 12,
  },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  overdueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 16,
  },
  overdueText: { flex: 1, fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12, marginTop: 4 },
  noSubs: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  subHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  typeText: { fontSize: 12, textTransform: 'capitalize' },
  verdictBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verdictText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  reasoning: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  textContent: { fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  subTime: { fontSize: 11 },
});
