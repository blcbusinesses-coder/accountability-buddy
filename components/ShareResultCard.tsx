/**
 * Feature 1 — Share Your Result Card (v3)
 * Proof-aware share card:
 *   photo  → submitted photo fills the background (dark scrim + swirl rings on top)
 *   text   → proof text appears in a glass box on the card
 *   audio  → card auto-plays the audio on reveal + shows playback controls
 */
import { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Alert, Image, Easing, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

const { width, height } = Dimensions.get('window');
const CARD_W = width - 48;
const ROBOT = require('../assets/icon-transparent.png');

// ── Swirling arc ring ─────────────────────────────────────────────────────────
function SwirlRing({
  size, duration, delay = 0, clockwise = true,
  color = 'rgba(74,255,114,0.14)', bw = 1.2, arc = false,
}: {
  size: number; duration: number; delay?: number;
  clockwise?: boolean; color?: string; bw?: number; arc?: boolean;
}) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration, useNativeDriver: true, easing: Easing.linear })
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);
  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });
  const borderColors = arc
    ? { borderTopColor: color, borderRightColor: color, borderBottomColor: 'transparent', borderLeftColor: 'transparent' }
    : { borderTopColor: color, borderRightColor: color, borderBottomColor: color, borderLeftColor: color };
  return (
    <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: bw, ...borderColors, transform: [{ rotate }] }} />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  taskName: string;
  streak: number;
  completionTime: string;
  onClose: () => void;
  proofMode?: 'photo' | 'text' | 'audio';
  proofPhotoUri?: string | null;
  proofText?: string | null;
  proofAudioUri?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShareResultCard({
  visible, taskName, streak, completionTime, onClose,
  proofMode, proofPhotoUri, proofText, proofAudioUri,
}: Props) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoFade  = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleY    = useRef(new Animated.Value(22)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsY    = useRef(new Animated.Value(16)).current;
  const btnsFade  = useRef(new Animated.Value(0)).current;
  const cardRef   = useRef<View>(null);

  // Audio state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);

  // ── Entrance animations ──
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.delay(160),
        Animated.parallel([
          Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
          Animated.timing(logoFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();
      Animated.sequence([
        Animated.delay(360),
        Animated.parallel([
          Animated.timing(titleFade, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(titleY, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(statsFade, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(statsY, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
        Animated.delay(80),
        Animated.timing(btnsFade, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();

      // Auto-play audio
      if (proofMode === 'audio' && proofAudioUri) {
        loadAndPlayAudio(proofAudioUri);
      }
    } else {
      // Reset
      slideAnim.setValue(height);
      logoScale.setValue(0.6); logoFade.setValue(0);
      titleFade.setValue(0);   titleY.setValue(22);
      statsFade.setValue(0);   statsY.setValue(16);
      btnsFade.setValue(0);
      unloadAudio();
    }
  }, [visible]);

  // ── Audio helpers ──
  const loadAndPlayAudio = async (uri: string) => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioPlaying(status.isPlaying);
            setAudioPosition(status.positionMillis ?? 0);
            setAudioDuration(status.durationMillis ?? 0);
          }
        }
      );
      soundRef.current = sound;
      setAudioPlaying(true);
    } catch {
      // silent — audio unavailable
    }
  };

  const unloadAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setAudioPlaying(false);
    setAudioPosition(0);
    setAudioDuration(0);
  };

  const toggleAudio = async () => {
    if (!soundRef.current) {
      if (proofAudioUri) loadAndPlayAudio(proofAudioUri);
      return;
    }
    if (audioPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progressPct = audioDuration > 0 ? audioPosition / audioDuration : 0;

  // ── Save / Share ──
  const saveToLibrary = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to save your card.'); return; }
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved! 🎉', 'Your result card was saved to your camera roll.');
    } catch { Alert.alert('Error', 'Could not save card. Try screenshotting instead.'); }
  };

  const shareCard = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      else Alert.alert('Not supported', 'Sharing is not available on this device.');
    } catch { Alert.alert('Error', 'Could not share card.'); }
  };

  if (!visible) return null;

  const hasPhoto = proofMode === 'photo' && proofPhotoUri;

  // Swirl ring opacity — more subtle when photo fills bg
  const swirlOpacity = hasPhoto ? 0.6 : 1;
  const sc = (v: number) => `rgba(74,255,114,${(v * swirlOpacity).toFixed(3)})`;

  // ── Card inner content (same for all modes) ──
  const CardContent = (
    <View style={styles.cardContent}>
      {/* Robot logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
        <Image source={ROBOT} style={styles.robotImg} />
      </Animated.View>

      {/* TASK COMPLETE badge */}
      <Animated.View style={[styles.badge, { opacity: titleFade, transform: [{ translateY: titleY }] }]}>
        <Ionicons name="checkmark-circle" size={13} color="#4AFF72" />
        <Text style={styles.badgeText}>TASK COMPLETE</Text>
      </Animated.View>

      {/* Task name */}
      <Animated.Text style={[styles.taskName, { opacity: titleFade, transform: [{ translateY: titleY }] }]} numberOfLines={3}>
        {taskName}
      </Animated.Text>

      {/* Proof-specific inlay */}
      <Animated.View style={{ opacity: statsFade, transform: [{ translateY: statsY }], width: '100%' }}>
        {proofMode === 'text' && proofText ? (
          /* Text proof box */
          <View style={styles.textProofBox}>
            <Ionicons name="document-text-outline" size={13} color="rgba(74,255,114,0.6)" style={{ marginBottom: 4 }} />
            <Text style={styles.textProofContent} numberOfLines={5}>{proofText}</Text>
          </View>
        ) : proofMode === 'audio' ? (
          /* Audio proof player */
          <View style={styles.audioBox}>
            <TouchableOpacity style={styles.audioPlayBtn} onPress={toggleAudio} activeOpacity={0.75}>
              <Ionicons name={audioPlaying ? 'pause' : 'play'} size={20} color="#4AFF72" />
            </TouchableOpacity>
            <View style={styles.audioRight}>
              <View style={styles.audioProgressTrack}>
                <View style={[styles.audioProgressFill, { width: `${progressPct * 100}%` }]} />
              </View>
              <View style={styles.audioTimesRow}>
                <Text style={styles.audioTime}>{fmtMs(audioPosition)}</Text>
                <Text style={styles.audioTime}>{fmtMs(audioDuration)}</Text>
              </View>
            </View>
            <Ionicons name="mic" size={13} color="rgba(74,255,114,0.5)" />
          </View>
        ) : null}
      </Animated.View>

      {/* Separator */}
      <Animated.View style={[styles.sep, { opacity: statsFade }]} />

      {/* Stats */}
      <Animated.View style={[styles.statsRow, { opacity: statsFade, transform: [{ translateY: statsY }] }]}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color="#4AFF72" />
          <Text style={styles.statVal}>{streak}</Text>
          <Text style={styles.statLbl}>day streak</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.45)" />
          <Text style={styles.statVal}>{completionTime}</Text>
          <Text style={styles.statLbl}>completed</Text>
        </View>
      </Animated.View>

      {/* Branding */}
      <Animated.View style={[styles.brandRow, { opacity: statsFade }]}>
        <Image source={ROBOT} style={styles.brandLogo} />
        <View>
          <Text style={styles.brandName}>Accountability Buddy</Text>
          <Text style={styles.brandTag}>Prove it. Or it didn't happen.</Text>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateY: slideAnim }] }]}>

      {/* ── Capturable card ── */}
      <View ref={cardRef} style={styles.card} collapsable={false}>

        {hasPhoto ? (
          /* ── Photo background ── */
          <ImageBackground source={{ uri: proofPhotoUri! }} style={styles.fill} resizeMode="cover">
            {/* Dark scrim so text stays readable */}
            <View style={[styles.fill, styles.photoScrim]} />
            {/* Swirl rings (more subtle over photo) */}
            <View style={styles.ringsWrap} pointerEvents="none">
              <SwirlRing size={CARD_W * 0.90} duration={22000} clockwise  color={sc(0.05)} bw={1} />
              <SwirlRing size={CARD_W * 0.75} duration={15000} clockwise={false} color={sc(0.08)} bw={1}   arc />
              <SwirlRing size={CARD_W * 0.58} duration={11000} delay={300} clockwise  color={sc(0.11)} bw={1.2} arc />
              <SwirlRing size={CARD_W * 0.42} duration={8000}  delay={150} clockwise={false} color={sc(0.16)} bw={1.2} arc />
              <SwirlRing size={CARD_W * 0.26} duration={5500}  delay={500} clockwise  color={sc(0.22)} bw={1.5} />
            </View>
            {CardContent}
          </ImageBackground>
        ) : (
          /* ── Black background (text / audio) ── */
          <>
            <View style={styles.cardBg} />
            <View style={styles.ringsWrap} pointerEvents="none">
              <SwirlRing size={CARD_W * 0.90} duration={22000} clockwise  color={sc(0.05)} bw={1} />
              <SwirlRing size={CARD_W * 0.75} duration={15000} clockwise={false} color={sc(0.09)} bw={1}   arc />
              <SwirlRing size={CARD_W * 0.58} duration={11000} delay={300} clockwise  color={sc(0.13)} bw={1.2} arc />
              <SwirlRing size={CARD_W * 0.42} duration={8000}  delay={150} clockwise={false} color={sc(0.18)} bw={1.2} arc />
              <SwirlRing size={CARD_W * 0.26} duration={5500}  delay={500} clockwise  color={sc(0.26)} bw={1.5} />
            </View>
            {CardContent}
          </>
        )}
      </View>

      {/* ── Action buttons (outside captured area) ── */}
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
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999, paddingHorizontal: 24, paddingBottom: 40,
  },

  // ── Card shell ──
  card: {
    width: CARD_W,
    aspectRatio: 9 / 16,
    maxHeight: height * 0.62,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.13)',
  },
  fill: { ...StyleSheet.absoluteFillObject },
  cardBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  photoScrim: { backgroundColor: 'rgba(0,0,0,0.52)' },
  ringsWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Content ──
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 11,
  },

  // ── Logo ──
  logoWrap: {
    shadowColor: '#4AFF72', shadowRadius: 24, shadowOpacity: 0.65,
    shadowOffset: { width: 0, height: 0 }, elevation: 12, marginBottom: 2,
  },
  robotImg: { width: 72, height: 72, borderRadius: 17 },

  // ── Badge ──
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(74,255,114,0.10)',
    borderWidth: 1, borderColor: 'rgba(74,255,114,0.22)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { color: '#4AFF72', fontSize: 10, letterSpacing: 1.8, fontFamily: 'Outfit_700Bold' },

  // ── Task name ──
  taskName: {
    fontSize: 20, color: '#FFFFFF',
    textAlign: 'center', letterSpacing: -0.3, lineHeight: 26,
    fontFamily: 'DMSerifDisplay_400Regular',
  },

  // ── Text proof ──
  textProofBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.18)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  textProofContent: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
  },

  // ── Audio proof ──
  audioBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(74,255,114,0.18)',
    borderRadius: 14,
    padding: 12,
  },
  audioPlayBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(74,255,114,0.12)',
    borderWidth: 1, borderColor: 'rgba(74,255,114,0.30)',
    justifyContent: 'center', alignItems: 'center',
  },
  audioRight: { flex: 1, gap: 4 },
  audioProgressTrack: {
    height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  audioProgressFill: { height: '100%', backgroundColor: '#4AFF72', borderRadius: 2 },
  audioTimesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  audioTime: { fontSize: 9, color: 'rgba(255,255,255,0.38)', fontFamily: 'Outfit_500Medium' },

  // ── Separator ──
  sep: { width: 44, height: 1, backgroundColor: 'rgba(74,255,114,0.40)' },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, paddingHorizontal: 22, paddingVertical: 12,
  },
  statItem: { alignItems: 'center', gap: 3 },
  statVal:  { fontSize: 18, color: '#FFFFFF', fontFamily: 'Outfit_700Bold' },
  statLbl:  { fontSize: 9,  color: 'rgba(255,255,255,0.38)', fontFamily: 'Outfit_500Medium' },
  statDiv:  { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.10)' },

  // ── Branding ──
  brandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    position: 'absolute', bottom: 16,
  },
  brandLogo: { width: 22, height: 22, borderRadius: 5, opacity: 0.7 },
  brandName: { fontSize: 10, color: 'rgba(255,255,255,0.38)', fontFamily: 'Outfit_600SemiBold' },
  brandTag:  { fontSize: 8,  color: 'rgba(255,255,255,0.20)', fontFamily: 'Outfit_400Regular' },

  // ── Action buttons ──
  actions: { width: '100%', gap: 10, marginTop: 18 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#4AFF72', borderRadius: 16, paddingVertical: 15,
  },
  saveBtnText: { color: '#000', fontSize: 15, fontFamily: 'Outfit_700Bold' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: 'rgba(74,255,114,0.10)',
    borderRadius: 16, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(74,255,114,0.28)',
  },
  shareBtnText: { color: '#4AFF72', fontSize: 15, fontFamily: 'Outfit_700Bold' },
  closeBtn: { alignItems: 'center', paddingVertical: 10 },
  closeBtnText: { color: 'rgba(255,255,255,0.32)', fontSize: 14, fontFamily: 'Outfit_500Medium' },
});
