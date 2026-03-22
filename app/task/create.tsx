import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import SceneBackground from '../../components/SceneBackground';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Missing title', 'Please enter a task title.'); return; }
    if (!user) return;
    if (dueDate <= new Date()) { Alert.alert('Invalid due date', 'Due date must be in the future.'); return; }

    setLoading(true);
    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate.toISOString().split('T')[0],
      due_time: dueDate.toTimeString().slice(0, 5),
      status: 'pending',
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  };

  const canCreate = title.trim().length > 0 && !loading;

  return (
    <SceneBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
          >
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: 'Outfit_600SemiBold' }]}>New Task</Text>
          <TouchableOpacity
            style={[styles.createBtn, {
              backgroundColor: theme.primary,
              shadowColor: '#4AFF72',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 16,
              shadowOpacity: 0.4,
            }, !canCreate && styles.disabled]}
            onPress={handleCreate}
            disabled={!canCreate}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={[styles.createBtnText, { fontFamily: 'Outfit_700Bold' }]}>Create</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, fontFamily: 'Outfit_600SemiBold' }]}>Task Title *</Text>
            <TextInput
              style={[styles.titleInput, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border, color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
              value={title}
              onChangeText={setTitle}
              placeholder="What do you need to do?"
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={120}
              autoFocus
            />
            <Text style={[styles.charCount, { color: theme.textMuted }]}>{title.length}/120</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, fontFamily: 'Outfit_600SemiBold' }]}>Description (optional)</Text>
            <TextInput
              style={[styles.descInput, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border, color: theme.textPrimary, fontFamily: 'Outfit_400Regular' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about how to prove completion..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Due Date & Time */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, fontFamily: 'Outfit_600SemiBold' }]}>Due Date & Time</Text>

            <TouchableOpacity
              style={[styles.dateRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}
              onPress={() => { setShowTimePicker(false); setShowDatePicker(true); }}
              activeOpacity={0.7}
            >
              <View style={[styles.dateIcon, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Date</Text>
                <Text style={[styles.dateValue, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>{formatDate(dueDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateRow, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}
              onPress={() => { setShowDatePicker(false); setShowTimePicker(true); }}
              activeOpacity={0.7}
            >
              <View style={[styles.dateIcon, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="time-outline" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Time</Text>
                <Text style={[styles.dateValue, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]}>{formatTime(dueDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={[styles.pickerWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DateTimePicker
                value={dueDate} mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (d) { const n = new Date(dueDate); n.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); setDueDate(n); }
                }}
                themeVariant={theme.isDark ? 'dark' : 'light'}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={[styles.pickerDone, { borderTopColor: theme.border }]} onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerDoneText, { color: theme.primary }]}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showTimePicker && (
            <View style={[styles.pickerWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <DateTimePicker
                value={dueDate} mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowTimePicker(false);
                  if (d) { const n = new Date(dueDate); n.setHours(d.getHours(), d.getMinutes()); setDueDate(n); }
                }}
                themeVariant={theme.isDark ? 'dark' : 'light'}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={[styles.pickerDone, { borderTopColor: theme.border }]} onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.pickerDoneText, { color: theme.primary }]}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tip */}
          <View style={[styles.tip, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
            <Ionicons name="bulb-outline" size={16} color={theme.primary} />
            <Text style={[styles.tipText, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
              You'll need to submit a photo, text, or audio proof to complete this task.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17 },
  createBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 72, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  createBtnText: { color: '#000', fontSize: 14 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  titleInput: {
    borderRadius: 14, padding: 14, fontSize: 17,
    borderWidth: 1, minHeight: 60, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  descInput: {
    borderRadius: 14, padding: 14, fontSize: 15,
    borderWidth: 1, minHeight: 90, textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, gap: 12,
  },
  dateIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateLabel: { fontSize: 11, marginBottom: 2 },
  dateValue: { fontSize: 15 },
  pickerWrap: {
    marginHorizontal: 20, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, marginBottom: 10,
  },
  pickerDone: { padding: 14, alignItems: 'center', borderTopWidth: 1 },
  pickerDoneText: { fontWeight: '600', fontSize: 15 },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 20, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
