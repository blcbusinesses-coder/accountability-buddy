import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import {
  verifyTaskWithPhoto,
  verifyTaskWithText,
  verifyTaskWithAudio,
  VerificationResult,
} from '../../lib/openai';

type SubmissionMode = 'photo' | 'text' | 'audio';

export default function SubmitScreen() {
  const { taskId, taskTitle, taskDescription } = useLocalSearchParams<{
    taskId: string;
    taskTitle: string;
    taskDescription: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<SubmissionMode>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow microphone access.');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    await recordingRef.current.stopAndUnloadAsync();
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    setIsRecording(false);

    if (uri) setAudioUri(uri);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!user || !taskId) return;

    if (mode === 'photo' && !photoUri) {
      Alert.alert('No photo', 'Please take or pick a photo first.');
      return;
    }
    if (mode === 'text' && !textContent.trim()) {
      Alert.alert('No text', 'Please describe how you completed the task.');
      return;
    }
    if (mode === 'audio' && !audioUri) {
      Alert.alert('No audio', 'Please record your explanation first.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let verification: VerificationResult;

      if (mode === 'photo' && photoUri) {
        verification = await verifyTaskWithPhoto(taskTitle ?? '', taskDescription ?? null, photoUri);
      } else if (mode === 'text') {
        verification = await verifyTaskWithText(taskTitle ?? '', taskDescription ?? null, textContent.trim());
      } else if (mode === 'audio' && audioUri) {
        verification = await verifyTaskWithAudio(taskTitle ?? '', taskDescription ?? null, audioUri);
      } else {
        throw new Error('No submission content');
      }

      setResult(verification);

      // Upload photo/audio to Supabase Storage if approved or for record keeping
      let contentUrl: string | null = null;
      if (mode === 'photo' && photoUri) {
        const ext = photoUri.split('.').pop() ?? 'jpg';
        const fileName = `${user.id}/${taskId}/${Date.now()}.${ext}`;
        const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
        const { data: uploadData } = await supabase.storage
          .from('submissions')
          .upload(fileName, decode(base64), { contentType: `image/${ext}` });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          contentUrl = urlData.publicUrl;
        }
      } else if (mode === 'audio' && audioUri) {
        const fileName = `${user.id}/${taskId}/${Date.now()}.m4a`;
        const base64 = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
        const { data: uploadData } = await supabase.storage
          .from('submissions')
          .upload(fileName, decode(base64), { contentType: 'audio/m4a' });
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(fileName);
          contentUrl = urlData.publicUrl;
        }
      }

      // Save submission record
      await supabase.from('submissions').insert({
        task_id: taskId,
        user_id: user.id,
        submission_type: mode,
        content_url: contentUrl,
        text_content: mode === 'text' ? textContent.trim() : null,
        ai_verdict: verification.verdict,
        ai_reasoning: verification.reasoning,
      });

      // Update task status if approved
      if (verification.verdict === 'approved') {
        await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId);
      }

    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // base64 decode helper
  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const ModeTab = ({ m, icon, label }: { m: SubmissionMode; icon: any; label: string }) => (
    <TouchableOpacity
      style={[styles.modeTab, mode === m && styles.modeTabActive]}
      onPress={() => { setMode(m); setResult(null); }}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={18} color={mode === m ? Colors.primaryLight : Colors.textMuted} />
      <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Proof</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Task name */}
        <View style={styles.taskBanner}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.taskBannerText} numberOfLines={1}>{taskTitle}</Text>
        </View>

        {/* Mode selector */}
        <View style={styles.modeTabs}>
          <ModeTab m="photo" icon="camera-outline" label="Photo" />
          <ModeTab m="text" icon="document-text-outline" label="Text" />
          <ModeTab m="audio" icon="mic-outline" label="Audio" />
        </View>

        {/* Result card */}
        {result && (
          <View style={[
            styles.resultCard,
            result.verdict === 'approved' ? styles.resultApproved : styles.resultRejected,
          ]}>
            <Ionicons
              name={result.verdict === 'approved' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={result.verdict === 'approved' ? Colors.success : Colors.error}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: result.verdict === 'approved' ? Colors.success : Colors.error }]}>
                {result.verdict === 'approved' ? 'Task Approved!' : 'Not Accepted'}
              </Text>
              <Text style={styles.resultReasoning}>{result.reasoning}</Text>
              {result.verdict === 'approved' ? (
                <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                  <Text style={styles.doneBtnText}>Back to Tasks</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.retryHint}>You can try again before the due date.</Text>
              )}
            </View>
          </View>
        )}

        {/* PHOTO mode */}
        {mode === 'photo' && (
          <View style={styles.modeContent}>
            {photoUri ? (
              <View>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.changePhotoBtn} onPress={pickPhoto}>
                  <Text style={styles.changePhotoBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.placeholderText}>Take or pick a photo as proof</Text>
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto} activeOpacity={0.8}>
                    <Ionicons name="camera" size={20} color={Colors.primaryLight} />
                    <Text style={styles.photoActionText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoActionBtn} onPress={pickPhoto} activeOpacity={0.8}>
                    <Ionicons name="images" size={20} color={Colors.primaryLight} />
                    <Text style={styles.photoActionText}>Library</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TEXT mode */}
        {mode === 'text' && (
          <View style={styles.modeContent}>
            <Text style={styles.inputLabel}>Describe how you completed the task</Text>
            <TextInput
              style={styles.textArea}
              value={textContent}
              onChangeText={setTextContent}
              placeholder="I completed the task by... (be specific!)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{textContent.length}/1000</Text>
          </View>
        )}

        {/* AUDIO mode */}
        {mode === 'audio' && (
          <View style={styles.modeContent}>
            <View style={styles.audioContainer}>
              <View style={[styles.audioOrb, isRecording && styles.audioOrbRecording]}>
                <Ionicons
                  name={isRecording ? 'radio-button-on' : audioUri ? 'checkmark' : 'mic'}
                  size={36}
                  color={isRecording ? Colors.error : audioUri ? Colors.success : Colors.primaryLight}
                />
              </View>

              <Text style={styles.audioStatus}>
                {isRecording
                  ? `Recording... ${formatDuration(recordingDuration)}`
                  : audioUri
                  ? `Recording ready (${formatDuration(recordingDuration)})`
                  : 'Tap to start recording'}
              </Text>

              <TouchableOpacity
                style={[styles.audioBtn, isRecording ? styles.audioBtnStop : styles.audioBtnStart]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={22} color="#fff" />
                <Text style={styles.audioBtnText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
              </TouchableOpacity>

              {audioUri && !isRecording && (
                <TouchableOpacity
                  style={styles.rerecordBtn}
                  onPress={() => { setAudioUri(null); setRecordingDuration(0); }}
                >
                  <Text style={styles.rerecordBtnText}>Re-record</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.audiоTip}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primaryLight} />
              <Text style={styles.audioTipText}>
                Your audio will be transcribed and analyzed by AI to verify task completion.
              </Text>
            </View>
          </View>
        )}

        {/* Submit button */}
        {!result || result.verdict === 'rejected' ? (
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitBtnText}>AI is verifying...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit for AI Review</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

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
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { flex: 1, padding: 20 },
  taskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.border,
  },
  taskBannerText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  modeTabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  modeTabActive: { backgroundColor: Colors.primaryMuted },
  modeTabText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  modeTabTextActive: { color: Colors.primaryLight },
  resultCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1,
  },
  resultApproved: { backgroundColor: Colors.successMuted, borderColor: Colors.success + '55' },
  resultRejected: { backgroundColor: Colors.errorMuted, borderColor: Colors.error + '55' },
  resultTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  resultReasoning: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  retryHint: { fontSize: 12, color: Colors.textMuted },
  doneBtn: {
    backgroundColor: Colors.success, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  doneBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modeContent: { marginBottom: 20 },
  photoPlaceholder: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  photoActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  photoActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryMuted, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  photoActionText: { color: Colors.primaryLight, fontWeight: '500', fontSize: 14 },
  photoPreview: {
    width: '100%', height: 280, borderRadius: 16, marginBottom: 12,
  },
  changePhotoBtn: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  changePhotoBtnText: { color: Colors.textSecondary, fontSize: 14 },
  inputLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  textArea: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    color: Colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
    minHeight: 150, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  audioContainer: { alignItems: 'center', gap: 16, paddingVertical: 20 },
  audioOrb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  audioOrbRecording: {
    borderColor: Colors.error, backgroundColor: Colors.errorMuted,
  },
  audioStatus: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
  },
  audioBtnStart: { backgroundColor: Colors.primary },
  audioBtnStop: { backgroundColor: Colors.error },
  audioBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  rerecordBtn: { padding: 8 },
  rerecordBtnText: { color: Colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' },
  audiоTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.primaryMuted, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  audioTipText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, gap: 10,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
