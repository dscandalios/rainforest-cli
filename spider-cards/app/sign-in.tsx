import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../src/lib/colors';
import { supabase } from '../src/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: 'spidercards://auth-callback' },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign-in failed', error.message);
      return;
    }
    setSent(true);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Spider Cards</Text>
      <Text style={styles.subtitle}>
        Photograph spiders. Build a deck. Climb the leaderboard.
      </Text>

      {sent ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Check your inbox</Text>
          <Text style={styles.dim}>
            We sent a sign-in link to {email}. Tap it on this device to come
            back here.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />
          <Pressable
            style={styles.btn}
            onPress={sendMagicLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.btnText}>Send magic link</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 14, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 14, marginBottom: 24 },
  input: {
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    padding: 14,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  box: {
    padding: 16,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  boxTitle: { color: colors.text, fontWeight: '700' },
  dim: { color: colors.textDim },
});
