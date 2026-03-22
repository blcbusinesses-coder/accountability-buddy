import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = [
  '#4AFF72', '#00E5A0', '#FFD60A', '#FF6B6B',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF8E53',
];
const COUNT = 90;

interface Piece {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  startX: number;
  isSquare: boolean;
}

interface Props {
  active: boolean;
  duration?: number;
}

export default function ConfettiOverlay({ active, duration = 3200 }: Props) {
  const pieces = useRef<Piece[]>(
    Array.from({ length: COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rot: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 9 + 4,
      startX: Math.random() * width,
      isSquare: Math.random() > 0.5,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    pieces.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.rot.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);

      const delay = Math.random() * 600;
      const travel = duration - delay;
      const driftX = (Math.random() - 0.5) * 120;
      const driftY = height * 0.55 + Math.random() * height * 0.35;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.opacity, {
            toValue: 1, duration: 80, useNativeDriver: true,
          }),
          Animated.spring(p.scale, {
            toValue: 1, tension: 120, friction: 5, useNativeDriver: true,
          }),
          Animated.timing(p.x, {
            toValue: driftX, duration: travel, useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: driftY, duration: travel, useNativeDriver: true,
          }),
          Animated.timing(p.rot, {
            toValue: Math.random() * 720 - 360, duration: travel, useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(travel * 0.65),
            Animated.timing(p.opacity, {
              toValue: 0, duration: travel * 0.35, useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.startX,
            top: -12,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isSquare ? 2 : p.size / 2,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              {
                rotate: p.rot.interpolate({
                  inputRange: [-360, 360],
                  outputRange: ['-360deg', '360deg'],
                }),
              },
              { scale: p.scale },
            ],
          }}
        />
      ))}
    </View>
  );
}
