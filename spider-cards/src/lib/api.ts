import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';
import type { Capture, ScanResponse } from '../types';

const MAX_DIMENSION = 1280;

function getSupabaseUrl(): string {
  return (
    (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    ''
  );
}

export async function uploadCapturePhoto(localUri: string): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('not signed in');

  // Resize + compress to keep upload + Claude vision cost down.
  const processed = await manipulateAsync(
    localUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.82, format: SaveFormat.JPEG },
  );

  const fileBytes = await FileSystem.readAsStringAsync(processed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = decodeBase64(fileBytes);

  const objectPath = `${user.id}/captures/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from('spider-photos')
    .upload(objectPath, bytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });
  if (error) throw error;
  return objectPath;
}

export async function scanSpider(opts: {
  photoPath: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
}): Promise<ScanResponse> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('not signed in');

  const url = `${getSupabaseUrl()}/functions/v1/scan-spider`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      photo_path: opts.photoPath,
      lat: opts.lat,
      lng: opts.lng,
      city: opts.city,
    }),
  });
  return (await res.json()) as ScanResponse;
}

export async function listMyCaptures(): Promise<Capture[]> {
  const { data, error } = await supabase
    .from('captures')
    .select('*, species:species_id(*)')
    .order('captured_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Capture[];
}

export async function getCapture(id: string): Promise<Capture | null> {
  const { data, error } = await supabase
    .from('captures')
    .select('*, species:species_id(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Capture | null;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  handle: string;
  species_id: string;
  common_name: string;
  scientific_name: string;
  tier: string;
  final_score: number;
  hp: number;
  damage: number;
  city: string | null;
  captured_at: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard_global')
    .select('*')
    .limit(100);
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

// Minimal base64 → Uint8Array. Avoids pulling buffer/atob polyfills.
function decodeBase64(b64: string): Uint8Array {
  const cleaned = b64.replace(/[\r\n]/g, '');
  const binary =
    typeof atob === 'function'
      ? atob(cleaned)
      : globalThis.Buffer
        ? globalThis.Buffer.from(cleaned, 'base64').toString('binary')
        : '';
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
