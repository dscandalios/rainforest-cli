import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { font, palette } from '../lib/theme';

type Phase = 'capturing' | 'uploading' | 'scanning';

const labels: Record<Phase, string> = {
  capturing: 'Capturing the image',
  uploading: 'Sealing the photograph',
  scanning: 'Consulting the bestiary',
};

export function ScanningOverlay({ phase }: { phase: Phase }) {
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0);
  const dot1 = useSharedValue(0.2);
  const dot2 = useSharedValue(0.2);
  const dot3 = useSharedValue(0.2);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    const cycle = (sv: typeof dot1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          -1,
          true,
        ),
      );
    };
    cycle(dot1, 0);
    cycle(dot2, 200);
    cycle(dot3, 400);
  }, [rotate, pulse, dot1, dot2, dot3]);

  const webStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.5,
    transform: [{ scale: 0.92 + pulse.value * 0.16 }],
  }));
  const dotStyle = (sv: typeof dot1) =>
    useAnimatedStyle(() => ({ opacity: sv.value }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      {/* full-bleed dark backdrop */}
      <View style={styles.backdrop} />

      {/* outer pulsing ring */}
      <Animated.View style={[styles.ring, pulseStyle]} />

      {/* slowly spinning web glyph */}
      <Animated.View style={[styles.webWrap, webStyle]}>
        <Text style={styles.webGlyph}>✷</Text>
      </Animated.View>

      <View style={styles.textWrap}>
        <Text style={styles.label}>{labels[phase]}</Text>
        <View style={styles.dots}>
          <Animated.Text style={[styles.dot, dotStyle(dot1)]}>·</Animated.Text>
          <Animated.Text style={[styles.dot, dotStyle(dot2)]}>·</Animated.Text>
          <Animated.Text style={[styles.dot, dotStyle(dot3)]}>·</Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.voidBlack,
    opacity: 0.93,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: palette.arcane,
  },
  webWrap: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webGlyph: {
    fontSize: 160,
    color: palette.aetherSilver,
    opacity: 0.55,
  },
  textWrap: {
    position: 'absolute',
    bottom: 110,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: font.title,
    fontStyle: 'italic',
    fontSize: 16,
    color: palette.bone,
    letterSpacing: 1,
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { color: palette.aetherSilver, fontSize: 28, lineHeight: 28 },
});
