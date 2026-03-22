/**
 * Feature 1 — Share Your Result Card
 * Full-screen shareable card that slides up after AI approval.
 */
import { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');

const GRADIENTS: [string, string, string][] = [
  ['#0a0a0f', '#0d2818', '#1a4a2e'],
  ['#0a0a0f', '#1a1a2e', '#16213e'],
  ['#080810', '#1a0a2e', '#2d1b4e'],
  ['#0a0f0a', '#162816', '#1f3a1f'],
  ['#100a0a', '#2e1414', '#4a1a1a'],
];

interface Props {
  visible: boolean;
  taskName: string;
  streak: number;
  completionTime: string;
  onClose: () => void;
}

export default function ShareResultCard({
  visible, taskName, streak, completionTime, onClose,
}: Props) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const streakFade = useRef(new Animated.Value(0)).current;
  const streakY = useRef(new Animated.Value(20)).current;
  const btnsFade = useRef(new Animated.Value(0)).current;
  const cardRef = useRef<View>(null);

  const gradientIndex = useRef(Math.floor(Math.random() * GRADIENTS.length)).current;

  useEffect(() => {
    if (visible) {
      // Slide card up
      Animated.spring(slideAnim, {
        toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
      }).start();
      // Staggered fade-ups
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(titleFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(streakFade, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(streakY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
        Animated.delay(100),
        Animated.timing(btnsFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(height);
      titleFade.setValue(0);
      titleY.setValue(20);
      streakFade.setValue(0);
      streakY.setValue(20);
      btnsFade.setValue(0);
    }
  }, [visible]);

  const saveToLibrary = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to save your card.');
        return;
      }
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved! 🎉', 'Your result card was saved to your camera roll.');
    } catch (e) {
      Alert.alert('Error', 'Could not save card. Try screenshotting instead.');
    }
  };

  const shareCard = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      } else {
        Alert.alert('Not supported', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not share card.');
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}
    >
      {/* The card itself (captured for share/save) */}
      <View
        ref={cardRef}
        style={styles.card}
        collapsable={false}
      >
        <LinearGradient
          colors={GRADIENTS[gradientIndex]}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glass container */}
          <View style={styles.glassBox}>
            {/* Trophy icon */}
            <View style={styles.trophyWrap}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>

            {/* Task name */}
            <Animated.Text
              style={[
                styles.taskName,
                { opacity: titleFade, transform: [{ translateY: titleY }] },
              ]}
              numberOfLines={3}
            >
              {taskName}
            </Animated.Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Streak + time */}
            <Animated.View
              style={[
                styles.statsRow,
                { opacity: streakFade, transform: [{ translateY: streakY }] },
              ]}
            >
              <View style={styles.statItem}>
                <Text style={styles.statValue}>🔥 {streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>✅ Done</Text>
                <Text style={styles.statLabel}>{completionTime}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Watermark */}
          <Text style={styles.watermark}>Accountability Buddy</Text>
        </LinearGradient>
      </View>

      {/* Action buttons */}
      <Animated.View style={[styles.actions, { opacity: btnsFade }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveToLibrary} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={20} color="#000" />
          <Text style={styles.saveBtnText}>Save to Camera Roll</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={shareCard} activeOpacity={0.8}>
          <Ionicons name="share-outline" size={20} color="#4AFF72" />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    width: width - 48,
    aspectRatio: 9 / 16,
    maxHeight: height * 0.62,
    borderRadius: 28,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  glassBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    padding: 24,
    alignItems: 'center',
  },
  trophyWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(74,255,114,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyEmoji: { fontSize: 36 },
  taskName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  statDivider: {
    width: 1, height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  watermark: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4AFF72',
    borderRadius: 16,
    paddingVertical: 15,
  },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(74,255,114,0.12)',
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.3)',
  },
  shareBtnText: { color: '#4AFF72', fontSize: 15, fontWeight: '700' },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
});
