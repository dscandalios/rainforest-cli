import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const rawUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  '';
const rawKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// If the dev hasn't wired up a Supabase project yet (e.g. just running the UI
// preview), fall back to harmless placeholders so createClient doesn't throw
// at module-import time. Any network call will still fail loudly, but the UI
// shell will render.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-anon-key';

export const supabaseConfigured =
  rawUrl.startsWith('http') && rawKey.length > 0 && !rawUrl.includes('YOUR-PROJECT');

const supabaseUrl = supabaseConfigured ? rawUrl : PLACEHOLDER_URL;
const supabaseAnonKey = supabaseConfigured ? rawKey : PLACEHOLDER_KEY;

if (!supabaseConfigured) {
  console.warn(
    '[spider-cards] Supabase not configured — UI will render but auth and uploads will fail. ' +
      'Set supabaseUrl + supabaseAnonKey in app.json extra (or EXPO_PUBLIC_* env vars).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function photoPublicUrl(path: string): string {
  const { data } = supabase.storage.from('spider-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function signedPhotoUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('spider-photos')
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
