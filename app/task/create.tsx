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
import { Colors } from '../../constants/colors';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a task title.');
      return;
    }
    if (!user) return;

    const now = new Date();
    if (dueDate <= now) {
      Alert.alert('Invalid due date', 'Due date must be in the future.');
      return;
    }

    setLoading(true);

    const dateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = dueDate.toTimeString().slice(0, 5);  // HH:MM

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dateStr,
      due_time: timeStr,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity
          style={[styles.saveBtn, (!title.trim() || loading) && styles.saveBtnDisabled]}
          onPress={handleCreate}
          disabled={!title.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Task title */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={120}
            autoFocus
          />
          <Text style={styles.charCount}>{title.length}/120</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details about how to prove completion..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Due Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date & Time</Text>

          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => {
              setShowTimePicker(false);
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconBg}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primaryLight} />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateValue}>{formatDate(dueDate)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => {
              setShowDatePicker(false);
              setShowTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconBg}>
              <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Time</Text>
              <Text style={styles.dateValue}>{formatTime(dueDate)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Inline DateTimePicker for Android */}
        {showDatePicker && (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (selectedDate) {
                  const next = new Date(dueDate);
                  next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                  setDueDate(next);
                }
              }}
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showTimePicker && (
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={dueDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') setShowTimePicker(false);
                if (selectedDate) {
                  const next = new Date(dueDate);
                  next.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                  setDueDate(next);
                }
              }}
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Tip */}
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.tipText}>
            You'll need to submit a photo, text, or audio proof to complete this task.
          </Text>
        </View>
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
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8, minWidth: 70, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1 },
  section: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4,
  },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  titleInput: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    fontSize: 17, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  descInput: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
    minHeight: 90, textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  dateIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
  },
  dateContent: { flex: 1 },
  dateLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  dateValue: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  pickerWrapper: {
    backgroundColor: Colors.surface, marginHorizontal: 20,
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  pickerDone: {
    padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  pickerDoneText: { color: Colors.primaryLight, fontWeight: '600', fontSize: 15 },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 20, padding: 14, backgroundColor: Colors.primaryMuted,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});
