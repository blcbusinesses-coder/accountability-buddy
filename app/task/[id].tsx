import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

type Submission = {
  id: string;
  submission_type: 'photo' | 'text' | 'audio';
  content_url: string | null;
  text_content: string | null;
  ai_verdict: 'approved' | 'rejected' | null;
  ai_reasoning: string | null;
  submitted_at: string;
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    const [taskRes, subsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('id', id).single(),
      supabase.from('submissions').select('*').eq('task_id', id).order('submitted_at', { ascending: false }),
    ]);
    if (taskRes.data) setTask(taskRes.data as Task);
    if (subsRes.data) setSubmissions(subsRes.data as Submission[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await supabase.from('submissions').delete().eq('task_id', id);
          await supabase.from('tasks').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>Task not found</Text>
      </SafeAreaView>
    );
  }

  const dueDate = new Date(`${task.due_date}T${task.due_time}`);
  const isOverdue = dueDate < new Date() && task.status === 'pending';
  const canSubmit = task.status === 'pending' && !isOverdue;

  const statusConfig = {
    pending: { label: 'Pending', color: Colors.primaryLight, bg: Colors.primaryMuted, icon: 'time-outline' as const },
    completed: { label: 'Completed', color: Colors.success, bg: Colors.successMuted, icon: 'checkmark-circle' as const },
    failed: { label: 'Failed', color: Colors.error, bg: Colors.errorMuted, icon: 'close-circle' as const },
  }[task.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Task Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color={Colors.error} size="small" />
          ) : (
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.taskTitle}>{task.title}</Text>

        {task.description ? (
          <Text style={styles.taskDesc}>{task.description}</Text>
        ) : null}

        {/* Due date card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primaryLight} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>
                {dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 12 }]}>
            <Ionicons name="time-outline" size={18} color={Colors.primaryLight} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Due Time</Text>
              <Text style={[styles.infoValue, isOverdue && { color: Colors.warning }]}>
                {dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                {isOverdue ? '  · Overdue' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Submit button */}
        {canSubmit && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => router.push({ pathname: '/task/submit', params: { taskId: id, taskTitle: task.title, taskDescription: task.description ?? '' } })}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Proof of Completion</Text>
          </TouchableOpacity>
        )}

        {/* Overdue message */}
        {isOverdue && (
          <View style={styles.overdueCard}>
            <Ionicons name="alert-circle" size={20} color={Colors.warning} />
            <Text style={styles.overdueText}>This task is overdue and will be marked as failed.</Text>
          </View>
        )}

        {/* Submissions history */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Submissions ({submissions.length})</Text>
        </View>

        {submissions.length === 0 ? (
          <View style={styles.noSubs}>
            <Text style={styles.noSubsText}>No submissions yet.</Text>
          </View>
        ) : (
          submissions.map((sub) => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.subHeader}>
                <View style={[
                  styles.subTypeBadge,
                  { backgroundColor: sub.submission_type === 'photo' ? '#1a2a3d' : sub.submission_type === 'audio' ? '#2a1a3d' : Colors.surfaceElevated }
                ]}>
                  <Ionicons
                    name={sub.submission_type === 'photo' ? 'camera' : sub.submission_type === 'audio' ? 'mic' : 'document-text'}
                    size={14}
                    color={sub.submission_type === 'photo' ? '#60a5fa' : sub.submission_type === 'audio' ? '#a78bfa' : Colors.textSecondary}
                  />
                  <Text style={styles.subTypeText}>{sub.submission_type}</Text>
                </View>
                <View style={[
                  styles.verdictBadge,
                  { backgroundColor: sub.ai_verdict === 'approved' ? Colors.successMuted : sub.ai_verdict === 'rejected' ? Colors.errorMuted : Colors.surfaceElevated }
                ]}>
                  <Text style={[
                    styles.verdictText,
                    { color: sub.ai_verdict === 'approved' ? Colors.success : sub.ai_verdict === 'rejected' ? Colors.error : Colors.textMuted }
                  ]}>
                    {sub.ai_verdict ?? 'Pending'}
                  </Text>
                </View>
              </View>

              {sub.ai_reasoning ? (
                <Text style={styles.subReasoning}>{sub.ai_reasoning}</Text>
              ) : null}

              {sub.text_content ? (
                <Text style={styles.subTextContent}>"{sub.text_content}"</Text>
              ) : null}

              <Text style={styles.subTime}>
                {new Date(sub.submitted_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  deleteBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, padding: 20 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
  },
  statusLabel: { fontSize: 13, fontWeight: '600' },
  taskTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  taskDesc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, gap: 10, marginBottom: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overdueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.warningMuted, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.warning + '44', marginBottom: 12,
  },
  overdueText: { flex: 1, color: Colors.warning, fontSize: 13 },
  sectionHeader: { marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  noSubs: { alignItems: 'center', paddingVertical: 24 },
  noSubsText: { color: Colors.textMuted, fontSize: 14 },
  subCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  subHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  subTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  subTypeText: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  verdictBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verdictText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  subReasoning: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  subTextContent: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  subTime: { fontSize: 11, color: Colors.textMuted },
});
