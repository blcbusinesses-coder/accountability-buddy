import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import SceneBackground from '../../components/SceneBackground';
import {
  verifyTaskWithPhoto, verifyTaskWithText, verifyTaskWithAudio, VerificationResult,
} from '../../lib/openai';
import { computeStreak } from '../../components/StreakBadge';
import ShareResultCard from '../../components/ShareResultCard';
import FirstUseCelebration, { shouldShowFirstUseCelebration } from '../../components/FirstUseCelebration';
import ApprovalMicroInteraction from '../../components/ApprovalMicroInteraction';
import { checkAndSendPersonalRecord, scheduleStreakProtectionNotification } from '../../lib/notifications';

type SubmissionMode = 'photo' | 'text' | 'audio';

function decode(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default function SubmitScreen() {
  const { taskId, taskTitle, taskDescription } = useLocalSearchParams<{
    taskId: string; taskTitle: string; taskDescription: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [mode, setMode] = useState<SubmissionMode>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Feature overlays
  const [showMicroInteraction, setShowMicroInteraction] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showFirstUse, setShowFirstUse] = useState(false);
  const [userStreak, setUserStreak] = useState(0);
  const [completionTime] = useState(
    new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
  );

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo library access.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, base64: true });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhotoBase64(res.assets[0].base64 ?? null);
    }
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow microphone access.'); return; }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
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

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!user || !taskId) return;
    if (mode === 'photo' && (!photoUri || !photoBase64)) {
      Alert.alert('No photo', 'Please take or pick a photo first.'); return;
    }
    if (mode === 'text' && !textContent.trim()) {
      Alert.alert('No text', 'Please describe how you completed the task.'); return;
    }
    if (mode === 'audio' && !audioUri) {
      Alert.alert('No audio', 'Please record your explanation first.'); return;
    }

    setLoading(true);
    setResult(null);

    try {
      let verification: VerificationResult;
      if (mode === 'photo' && photoBase64) {
        verification = await verifyTaskWithPhoto(taskTitle ?? '', taskDescription ?? null, photoBase64);
      } else if (mode === 'text') {
        verification = await verifyTaskWithText(taskTitle ?? '', taskDescription ?? null, textContent.trim());
      } else if (mode === 'audio' && audioUri) {
        verification = await verifyTaskWithAudio(taskTitle ?? '', taskDescription ?? null, audioUri);
      } else throw new Error('No submission content');

      setResult(verification);

      let contentUrl: string | null = null;
      if (mode === 'photo' && photoBase64 && photoUri) {
        const ext = photoUri.split('.').pop() ?? 'jpg';
        const fileName = `${user.id}/${taskId}/${Date.now()}.${ext}`;
        const { data: up } = await supabase.storage
          .from('submissions')
          .upload(fileName, decode(photoBase64), { contentType: `image/${ext}` });
        if (up) contentUrl = supabase.storage.from('submissions').getPublicUrl(fileName).data.publicUrl;
      } else if (mode === 'audio' && audioUri) {
        const fileName = `${user.id}/${taskId}/${Date.now()}.m4a`;
        const base64 = await FileSystem.readAsStringAsync(audioUri, { encoding: 'base64' as any });
        const { data: up } = await supabase.storage
          .from('submissions')
          .upload(fileName, decode(base64), { contentType: 'audio/m4a' });
        if (up) contentUrl = supabase.storage.from('submissions').getPublicUrl(fileName).data.publicUrl;
      }

      await supabase.from('submissions').insert({
        task_id: taskId, user_id: user.id,
        submission_type: mode, content_url: contentUrl,
        text_content: mode === 'text' ? textContent.trim() : null,
        ai_verdict: verification.verdict, ai_reasoning: verification.reasoning,
      });

      if (verification.verdict === 'approved') {
        await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId);

        // Fetch all user tasks for streak calculation
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        const streak = allTasks ? computeStreak(allTasks as any) : 0;
        setUserStreak(streak);

        // Feature 4: Micro-interaction
        setShowMicroInteraction(true);

        // Feature 6: Check personal record & streak protection notifications
        const firstName = user.user_metadata?.full_name?.split(' ')[0]
          ?? user.email?.split('@')[0]
          ?? 'there';
        checkAndSendPersonalRecord(user.id, firstName);
        if (streak > 0) {
          scheduleStreakProtectionNotification(user.id, firstName, streak);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicroInteractionComplete = async () => {
    setShowMicroInteraction(false);
    // Feature 5: First use celebration
    const isFirst = await shouldShowFirstUseCelebration();
    if (isFirst) {
      setShowFirstUse(true);
    } else {
      // Feature 1: Share card
      setShowShareCard(true);
    }
  };

  const ModeTab = ({ m, icon, label }: { m: SubmissionMode; icon: any; label: string }) => {
    const active = mode === m;
    return (
      <TouchableOpacity
        style={[styles.modeTab, active && {
          backgroundColor: theme.primaryMuted,
          borderColor: 'rgba(74,255,114,0.15)',
        }]}
        onPress={() => { setMode(m); setResult(null); setPhotoBase64(null); }}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={17} color={active ? theme.primary : theme.textMuted} />
        <Text style={[styles.modeTabText, { color: active ? theme.primary : theme.textMuted, fontFamily: 'Outfit_600SemiBold' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SceneBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
          >
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: 'Outfit_600SemiBold' }]}>Submit Proof</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Task banner */}
            <View style={[styles.taskBanner, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
              <Text style={[styles.taskBannerText, { color: theme.textPrimary, fontFamily: 'Outfit_500Medium' }]} numberOfLines={1}>
                {taskTitle}
              </Text>
            </View>

            {/* Mode tabs */}
            <View style={[styles.modeTabs, { backgroundColor: 'rgba(255,255,255,0.055)', borderColor: 'rgba(255,255,255,0.10)' }]}>
              <ModeTab m="photo" icon="camera-outline" label="Photo" />
              <ModeTab m="text" icon="document-text-outline" label="Text" />
              <ModeTab m="audio" icon="mic-outline" label="Audio" />
            </View>

            {/* Feature 4: Micro-interaction overlay */}
            {showMicroInteraction && (
              <ApprovalMicroInteraction onComplete={handleMicroInteractionComplete} />
            )}

            {/* Result card */}
            {result && !showMicroInteraction && (
              <View style={[styles.resultCard, {
                backgroundColor: result.verdict === 'approved' ? theme.successMuted : theme.errorMuted,
                borderColor: result.verdict === 'approved' ? theme.success + '55' : theme.error + '55',
              }]}>
                <Ionicons
                  name={result.verdict === 'approved' ? 'checkmark-circle' : 'close-circle'}
                  size={30}
                  color={result.verdict === 'approved' ? theme.success : theme.error}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultTitle, {
                    color: result.verdict === 'approved' ? theme.success : theme.error,
                    fontFamily: 'Outfit_700Bold',
                  }]}>
                    {result.verdict === 'approved' ? 'Task Approved!' : 'Not Accepted'}
                  </Text>
                  <Text style={[styles.resultReasoning, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
                    {result.reasoning}
                  </Text>
                  {result.verdict === 'approved' ? (
                    <TouchableOpacity
                      style={[styles.doneBtn, { backgroundColor: theme.success }]}
                      onPress={() => router.back()}
                    >
                      <Text style={[styles.doneBtnText, { fontFamily: 'Outfit_700Bold' }]}>Back to Tasks</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.retryHint, { color: theme.textMuted, fontFamily: 'Outfit_400Regular' }]}>
                      You can try again before the due date.
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* PHOTO */}
            {mode === 'photo' && (
              <View>
                {photoUri ? (
                  <>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                    <TouchableOpacity
                      style={[styles.outlineBtn, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
                      onPress={pickPhoto}
                    >
                      <Text style={[styles.outlineBtnText, { color: theme.textSecondary }]}>Change Photo</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.055)', borderColor: theme.border }]}>
                    <Ionicons name="camera-outline" size={44} color={theme.textMuted} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
                      Take or pick a photo as proof
                    </Text>
                    <View style={styles.photoActions}>
                      <TouchableOpacity
                        style={[styles.photoActionBtn, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}
                        onPress={takePhoto} activeOpacity={0.8}
                      >
                        <Ionicons name="camera" size={18} color={theme.primary} />
                        <Text style={[styles.photoActionText, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.photoActionBtn, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}
                        onPress={pickPhoto} activeOpacity={0.8}
                      >
                        <Ionicons name="images" size={18} color={theme.primary} />
                        <Text style={[styles.photoActionText, { color: theme.primary, fontFamily: 'Outfit_600SemiBold' }]}>Library</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TEXT */}
            {mode === 'text' && (
              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>
                  Describe how you completed the task
                </Text>
                <TextInput
                  style={[styles.textArea, {
                    backgroundColor: 'rgba(255,255,255,0.055)', borderColor: theme.border, color: theme.textPrimary,
                    fontFamily: 'Outfit_400Regular',
                  }]}
                  value={textContent}
                  onChangeText={setTextContent}
                  placeholder="I completed the task by... (be specific!)"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={[styles.charCount, { color: theme.textMuted }]}>{textContent.length}/1000</Text>
              </View>
            )}

            {/* AUDIO */}
            {mode === 'audio' && (
              <View>
                <View style={styles.audioContainer}>
                  <View style={[styles.audioOrb, {
                    backgroundColor: isRecording ? theme.errorMuted : theme.primaryMuted,
                    borderColor: isRecording ? theme.error : theme.border,
                  }]}>
                    <Ionicons
                      name={isRecording ? 'radio-button-on' : audioUri ? 'checkmark' : 'mic'}
                      size={34}
                      color={isRecording ? theme.error : audioUri ? theme.success : theme.primary}
                    />
                  </View>
                  <Text style={[styles.audioStatus, { color: theme.textSecondary, fontFamily: 'Outfit_500Medium' }]}>
                    {isRecording
                      ? `Recording... ${fmt(recordingDuration)}`
                      : audioUri
                      ? `Ready (${fmt(recordingDuration)})`
                      : 'Tap to start recording'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.audioBtn, { backgroundColor: isRecording ? theme.error : theme.primary }]}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color="#000" />
                    <Text style={[styles.audioBtnText, { fontFamily: 'Outfit_700Bold' }]}>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </TouchableOpacity>
                  {audioUri && !isRecording && (
                    <TouchableOpacity onPress={() => { setAudioUri(null); setRecordingDuration(0); }}>
                      <Text style={[styles.rerecordText, { color: theme.textMuted }]}>Re-record</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.tip, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
                  <Ionicons name="information-circle-outline" size={15} color={theme.primary} />
                  <Text style={[styles.tipText, { color: theme.textSecondary, fontFamily: 'Outfit_400Regular' }]}>
                    Your audio will be transcribed and analyzed by AI to verify task completion.
                  </Text>
                </View>
              </View>
            )}

            {/* Submit button */}
            {(!result || result.verdict === 'rejected') && !showMicroInteraction && (
              <TouchableOpacity
                style={[styles.submitBtn, {
                  backgroundColor: theme.primary,
                  shadowColor: '#4AFF72',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 0.45,
                }, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#000" />
                    <Text style={[styles.submitBtnText, { fontFamily: 'Outfit_700Bold' }]}>AI is verifying...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="send" size={17} color="#000" />
                    <Text style={[styles.submitBtnText, { fontFamily: 'Outfit_700Bold' }]}>Submit for AI Review</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Feature 1: Share Result Card */}
        <ShareResultCard
          visible={showShareCard}
          taskName={taskTitle ?? ''}
          streak={userStreak}
          completionTime={completionTime}
          onClose={() => {
            setShowShareCard(false);
            router.back();
          }}
          proofMode={mode}
          proofPhotoUri={photoUri}
          proofText={mode === 'text' ? textContent : null}
          proofAudioUri={mode === 'audio' ? audioUri : null}
        />

        {/* Feature 5: First-Use Celebration */}
        {showFirstUse && (
          <FirstUseCelebration
            taskName={taskTitle ?? ''}
            onContinue={() => {
              setShowFirstUse(false);
              setShowShareCard(true);
            }}
          />
        )}
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
  content: { padding: 16, gap: 16 },
  taskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1,
  },
  taskBannerText: { flex: 1, fontSize: 14 },
  modeTabs: {
    flexDirection: 'row', borderRadius: 14, padding: 4, borderWidth: 1, overflow: 'hidden',
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  modeTabText: { fontSize: 13 },
  resultCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderRadius: 14, padding: 16, borderWidth: 1,
  },
  resultTitle: { fontSize: 16, marginBottom: 6 },
  resultReasoning: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  retryHint: { fontSize: 12 },
  doneBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  doneBtnText: { color: '#000', fontSize: 13 },
  photoPlaceholder: {
    borderRadius: 16, padding: 32, alignItems: 'center', gap: 12,
    borderWidth: 1, borderStyle: 'dashed',
  },
  placeholderText: { fontSize: 14, textAlign: 'center' },
  photoActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  photoActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1,
  },
  photoActionText: { fontSize: 14 },
  photoPreview: { width: '100%', height: 280, borderRadius: 16, marginBottom: 10 },
  outlineBtn: { borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1 },
  outlineBtnText: { fontSize: 14 },
  inputLabel: { fontSize: 13, marginBottom: 8 },
  textArea: {
    borderRadius: 14, padding: 14, fontSize: 15,
    borderWidth: 1, minHeight: 150, textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  audioContainer: { alignItems: 'center', gap: 16, paddingVertical: 20 },
  audioOrb: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  audioStatus: { fontSize: 14 },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14,
  },
  audioBtnText: { color: '#000', fontSize: 15 },
  rerecordText: { fontSize: 13, textDecorationLine: 'underline' },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, padding: 12, borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, padding: 16, gap: 10,
  },
  disabled: { opacity: 0.6 },
  submitBtnText: { color: '#000', fontSize: 16 },
});
