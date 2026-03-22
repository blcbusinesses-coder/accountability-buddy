import { View, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  tint?: 'green' | 'red' | 'neutral';
}

const TINTS = {
  green: { bg: 'rgba(74,255,114,0.07)', border: 'rgba(74,255,114,0.15)' },
  red: { bg: 'rgba(255,80,80,0.07)', border: 'rgba(255,80,80,0.15)' },
  neutral: { bg: 'rgba(255,255,255,0.055)', border: 'rgba(255,255,255,0.10)' },
};

export default function GlassCard({ children, style, tint = 'neutral' }: Props) {
  const { bg, border } = TINTS[tint];
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>
      {/* Top specular highlight */}
      <View style={styles.specular} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
