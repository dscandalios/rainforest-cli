import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { font, palette } from '../src/lib/theme';
import { supabase } from '../src/lib/supabase';

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1,
    );
  }, [rotate]);

  const webStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  async function enterAsGuest() {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (error) {
      Alert.alert(
        'Sign-in failed',
        error.message +
          '\n\nMake sure Anonymous Sign-Ins are enabled in your Supabase project: Authentication → Providers.',
      );
    }
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[palette.voidBlack, '#0c0a18', palette.voidBlack]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.webBg, webStyle]} pointerEvents="none">
        <Text style={styles.webGlyph}>✷</Text>
      </Animated.View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>· A SPIDER COMPENDIUM ·</Text>
        <Text style={styles.title}>Spider Cards</Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>
          Photograph the eight-legged. Bind them to vellum. Build your bestiary.
        </Text>

        <Pressable
          style={styles.btn}
          onPress={enterAsGuest}
          disabled={loading}
        >
          <LinearGradient
            colors={[palette.aetherGold, palette.ember]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {loading ? (
            <ActivityIndicator color={palette.voidBlack} />
          ) : (
            <Text style={styles.btnText}>Enter the Bestiary</Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Dev preview · taps in as a wandering guest.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.voidBlack },
  webBg: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.07,
  },
  webGlyph: { fontSize: 360, color: palette.aetherSilver },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    gap: 14,
  },
  eyebrow: {
    color: palette.aetherGold,
    fontFamily: font.title,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 6,
    textAlign: 'center',
    opacity: 0.85,
  },
  title: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 44,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rule: {
    alignSelf: 'center',
    width: 60,
    height: 1,
    backgroundColor: palette.aetherGold,
    opacity: 0.6,
    marginVertical: 8,
  },
  subtitle: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 20,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.aetherGold,
    overflow: 'hidden',
  },
  btnText: {
    color: palette.voidBlack,
    fontFamily: font.title,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 2,
  },
  note: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
  },
});
