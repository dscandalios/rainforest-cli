import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { font, palette, tierTheme } from '../lib/theme';
import type { Tier } from '../types';

interface Props {
  tier: Tier;
  onDone: () => void;
}

/**
 * Full-screen "SPIDER CAPTURED" reveal that plays once before the card.
 * Sequence: dark wash fades in → text scales in with letter-spacing reveal →
 * holds 700ms → fades out → onDone fires.
 */
export function CapturedBanner({ tier, onDone }: Props) {
  const tt = tierTheme[tier];
  const wash = useSharedValue(0);
  const textScale = useSharedValue(0.4);
  const textOpacity = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    wash.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    flash.value = withSequence(
      withTiming(0.9, { duration: 90, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 240, easing: Easing.in(Easing.cubic) }),
    );
    textScale.value = withDelay(
      120,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.back(1.4)) }),
    );
    textOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    subOpacity.value = withDelay(
      520,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );

    const total = 1700;
    const exit = withDelay(
      total,
      withTiming(
        0,
        { duration: 320, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onDone)();
        },
      ),
    );
    wash.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      withDelay(total - 220, withTiming(0, { duration: 320 })),
    );
    textOpacity.value = withDelay(
      120,
      withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withDelay(total - 420, withTiming(0, { duration: 280 })),
      ),
    );
    subOpacity.value = withDelay(
      520,
      withSequence(
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withDelay(total - 880, withTiming(0, { duration: 240 })),
      ),
    );
    // ensure onDone fires
    setTimeout(onDone, total + 380);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subOpacity.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, washStyle]}>
        <LinearGradient
          colors={[palette.voidBlack, tt.deep, palette.voidBlack]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, flashStyle, { backgroundColor: tt.accent }]}
      />

      <View style={styles.center} pointerEvents="none">
        <Animated.Text style={[styles.eyebrow, subStyle, { color: tt.accent }]}>
          {tierTheme[tier].label.toUpperCase()} CAPTURE
        </Animated.Text>
        <Animated.Text style={[styles.title, textStyle, { color: palette.bone }]}>
          SPIDER CAPTURED
        </Animated.Text>
        <Animated.View style={[styles.rule, subStyle, { backgroundColor: tt.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  eyebrow: {
    fontFamily: font.title,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 6,
  },
  title: {
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 34,
    letterSpacing: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  rule: { width: 80, height: 1, marginTop: 6 },
});
