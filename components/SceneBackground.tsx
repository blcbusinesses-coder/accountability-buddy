import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SceneBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      {/* Layer 1: deep base */}
      <View style={[styles.absolute, { backgroundColor: '#060d0a' }]} />
      {/* Layer 2: top-left green glow */}
      <LinearGradient
        colors={['rgba(74,255,114,0.11)', 'transparent']}
        style={[styles.absolute, styles.topLeft]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      {/* Layer 3: top-right teal glow */}
      <LinearGradient
        colors={['rgba(0,200,150,0.07)', 'transparent']}
        style={[styles.absolute, styles.topRight]}
        start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }}
      />
      {/* Layer 4: bottom center deep forest */}
      <LinearGradient
        colors={['transparent', 'rgba(20,80,60,0.18)']}
        style={[styles.absolute, styles.bottomCenter]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  absolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topLeft: { width: '70%', height: '45%', top: 0, left: 0 },
  topRight: { width: '50%', height: '40%', top: 0, right: 0 },
  bottomCenter: { height: '55%', bottom: 0 },
});
