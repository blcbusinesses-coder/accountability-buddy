/**
 * Feature 3 — 30-Second Value Hook (Onboarding)
 * Demo flow: pre-loaded task → submit proof → instant AI approval → confetti → sign-up CTA
 */
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiOverlay from '../components/ConfettiOverlay';

const { width, height } = Dimensions.get('window');

const DEMO_TASK = 'Do 10 pushups';
type Step = 'task_list' | 'submit' | 'approved' | 'cta';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('task_list');
  const [inputText, setInputText] = useState('');
  const [confetti, setConfetti] = useState(false);

  // Animations
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(height)).current;
  const approvalScale = useRef(new Animated.Value(0.7)).current;
  const approvalOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(30)).current;
  const taskOpacity = useRef(new Animated.Value(1)).current;
  const taskScale = useRef(new Animated.Value(1)).current;

  // Pulsing arrow
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 8, duration: 600, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const openSubmitDrawer = () => {
    setStep('submit');
    Animated.spring(drawerAnim, {
      toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
    }).start();
  };

  const handleDemoSubmit = () => {
    if (!inputText.trim()) return;

    // Close keyboard, show fake "analyzing"
    setStep('approved');

    // Hide drawer
    Animated.timing(drawerAnim, {
      toValue: height, duration: 300, useNativeDriver: true,
    }).start();

    // Burst task off screen
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(taskScale, { toValue: 1.08, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.timing(taskOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Confetti
    setTimeout(() => setConfetti(true), 250);

    // Show approval badge
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.spring(approvalScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.timing(approvalOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Show CTA
    Animated.sequence([
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start(() => setStep('cta'));
  };

  const goToSignup = async () => {
    await AsyncStorage.setItem('@onboarding_done', 'true');
    router.replace('/(auth)/signup');
  };

  const goToLogin = async () => {
    await AsyncStorage.setItem('@onboarding_done', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={['#080810', '#0a1a0a', '#080808']}
      style={styles.container}
    >
      <ConfettiOverlay active={confetti} duration={3200} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Accountability Buddy</Text>
        <Text style={styles.tagline}>Prove it. Or it didn't happen.</Text>
      </View>

      {/* Task list demo */}
      {step !== 'cta' && (
        <View style={styles.taskSection}>
          <Text style={styles.sectionLabel}>Your task</Text>
          <Animated.View style={{ opacity: taskOpacity, transform: [{ scale: taskScale }] }}>
            <TouchableOpacity
              style={styles.demoTask}
              onPress={openSubmitDrawer}
              activeOpacity={0.8}
            >
              <View style={styles.demoTaskIcon}>
                <Ionicons name="time-outline" size={20} color="#4AFF72" />
              </View>
              <View style={styles.demoTaskContent}>
                <Text style={styles.demoTaskTitle}>{DEMO_TASK}</Text>
                <Text style={styles.demoTaskSub}>Tap to submit proof</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </Animated.View>

          {/* Pulsing arrow */}
          {step === 'task_list' && (
            <Animated.View
              style={[styles.arrowHint, { transform: [{ translateY: arrowAnim }] }]}
            >
              <Ionicons name="arrow-up" size={20} color="#4AFF72" />
              <Text style={styles.arrowText}>Tap the task</Text>
            </Animated.View>
          )}
        </View>
      )}

      {/* Approval state */}
      {(step === 'approved' || step === 'cta') && (
        <Animated.View
          style={[
            styles.approvalBadge,
            { opacity: approvalOpacity, transform: [{ scale: approvalScale }] },
          ]}
        >
          <Text style={styles.approvalEmoji}>✅</Text>
          <Text style={styles.approvalTitle}>Task Approved!</Text>
          <Text style={styles.approvalSub}>{DEMO_TASK}</Text>
        </Animated.View>
      )}

      {/* CTA */}
      {step === 'cta' && (
        <Animated.View
          style={[styles.ctaSection, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}
        >
          <Text style={styles.ctaTitle}>That's how it works.</Text>
          <Text style={styles.ctaSub}>Now make it yours.</Text>

          <TouchableOpacity style={styles.ctaBtn} onPress={goToSignup} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Create Free Account →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToLogin} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Submit drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateY: drawerAnim }] }]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerTitle}>Submit your proof</Text>
          <Text style={styles.drawerTask}>"{DEMO_TASK}"</Text>

          <TextInput
            style={styles.drawerInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type anything — I did 10 pushups..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            autoFocus
          />

          <TouchableOpacity
            style={[styles.drawerBtn, !inputText.trim() && styles.drawerBtnDisabled]}
            onPress={handleDemoSubmit}
            activeOpacity={0.85}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={16} color="#000" />
            <Text style={styles.drawerBtnText}>Submit for AI Review</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setStep('task_list');
            Animated.timing(drawerAnim, { toValue: height, duration: 280, useNativeDriver: true }).start();
          }}>
            <Text style={styles.drawerCancel}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80 },
  header: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 48 },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  taskSection: { paddingHorizontal: 20, gap: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  demoTask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.25)',
    padding: 14,
    gap: 12,
  },
  demoTaskIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(74,255,114,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoTaskContent: { flex: 1 },
  demoTaskTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  demoTaskSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  arrowHint: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  arrowText: { fontSize: 12, color: '#4AFF72', fontWeight: '600' },
  approvalBadge: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 10,
  },
  approvalEmoji: { fontSize: 56 },
  approvalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4AFF72',
    letterSpacing: -0.5,
  },
  approvalSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 48,
    gap: 12,
  },
  ctaTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  ctaSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaBtn: {
    backgroundColor: '#4AFF72',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  loginLink: { paddingVertical: 8 },
  loginLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111118',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  drawerTask: { fontSize: 13, color: '#4AFF72', fontStyle: 'italic' },
  drawerInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontSize: 15,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  drawerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4AFF72',
    borderRadius: 14,
    paddingVertical: 15,
  },
  drawerBtnDisabled: { opacity: 0.4 },
  drawerBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  drawerCancel: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    paddingVertical: 8,
  },
});
