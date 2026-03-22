/**
 * SwirlRings — fullscreen animated swirl arc background overlay.
 * Renders behind content (pointerEvents="none", absolute fill).
 * Used on the home screen and inside the share result card.
 */
import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE = Math.max(width, height);

interface RingConfig {
  size: number;
  duration: number;
  delay?: number;
  clockwise?: boolean;
  color?: string;
  bw?: number;
  arc?: boolean;
}

function SwirlRing({ size, duration, delay = 0, clockwise = true, color = 'rgba(74,255,114,0.12)', bw = 1, arc = false }: RingConfig) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);

  const rotate = rot.interpolate({
    inputRange: [0, 1],
    outputRange: clockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });

  const borderColors = arc
    ? {
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
      }
    : {
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: color,
      };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: bw,
        ...borderColors,
        transform: [{ rotate }],
      }}
    />
  );
}

interface Props {
  /** Multiply all ring opacities. 0–1, default 1. */
  intensity?: number;
}

export default function SwirlRings({ intensity = 1 }: Props) {
  // Scale opacity by intensity
  const o = (base: number) => `rgba(74,255,114,${(base * intensity).toFixed(3)})`;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Outermost very slow full ring */}
      <SwirlRing size={BASE * 1.1}  duration={28000} clockwise  color={o(0.04)} bw={1} />
      {/* Large counter-clockwise arc */}
      <SwirlRing size={BASE * 0.92} duration={20000} clockwise={false} color={o(0.06)} bw={1}   arc />
      {/* Medium clockwise arc */}
      <SwirlRing size={BASE * 0.74} duration={14000} delay={400}  clockwise  color={o(0.09)} bw={1}   arc />
      {/* Tighter counter arc */}
      <SwirlRing size={BASE * 0.56} duration={10000} delay={200}  clockwise={false} color={o(0.12)} bw={1.2} arc />
      {/* Fast inner accent */}
      <SwirlRing size={BASE * 0.38} duration={7000}  delay={600}  clockwise  color={o(0.16)} bw={1.2} />
      {/* Tiny core ring */}
      <SwirlRing size={BASE * 0.22} duration={5000}  delay={100}  clockwise={false} color={o(0.20)} bw={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
