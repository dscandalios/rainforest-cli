import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../src/lib/colors';
import { supabase } from '../src/lib/supabase';

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);

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
      <Text style={styles.title}>Spider Cards</Text>
      <Text style={styles.subtitle}>
        Photograph spiders. Build a deck. Climb the leaderboard.
      </Text>

      <Pressable
        style={styles.btn}
        onPress={enterAsGuest}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Get started</Text>
        )}
      </Pressable>

      <Text style={styles.note}>
        Dev preview — taps in as a guest. Email sign-in comes later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 14, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 14, marginBottom: 24 },
  btn: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  note: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
