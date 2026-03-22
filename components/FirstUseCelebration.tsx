/**
 * Feature 5 — First-Use Celebration
 * Full-screen overlay on the very first task completion. Shows once only.
 */
import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiOverlay from './ConfettiOverlay';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = '@has_completed_first_task';

interface Props {
  taskName: string;
  onContinue: () => void;
}

export default function FirstUseCelebration({ taskName, onContinue }: Props) {
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.7)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(titleScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    onContinue();
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      {/* Blurred gradient bg */}
      <View style={styles.bg} />

      {/* Confetti */}
      <ConfettiOverlay active={true} duration={3500} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.label,
            { opacity: titleOpacity, transform: [{ scale: titleScale }] },
          ]}
        >
          First proof accepted.
        </Animated.Text>

        <Animated.Text style={[styles.taskText, { opacity: subtitleOpacity }]}>
          "{taskName}"
        </Animated.Text>

        <Animated.Text style={[styles.sub, { opacity: subtitleOpacity }]}>
          You showed up. That's what this is about.
        </Animated.Text>

        <Animated.View style={{ opacity: btnOpacity, transform: [{ scale: btnScale }] }}>
          <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.btnText}>Keep the streak alive →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export async function shouldShowFirstUseCelebration(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val === null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,12,0.94)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  label: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 16,
  },
  taskText: {
    fontSize: 17,
    color: '#4AFF72',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  sub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  btn: {
    backgroundColor: '#4AFF72',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
