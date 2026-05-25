import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/Avatar';
import {
  avatarPublicUrl,
  getMyProfile,
  listMyCaptures,
  updateMyProfile,
  uploadAvatar,
} from '../../src/lib/api';
import { supabase } from '../../src/lib/supabase';
import { font, palette, tierTheme } from '../../src/lib/theme';
import type { Capture, Tier } from '../../src/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', 'mine'],
    queryFn: getMyProfile,
  });
  const { data: captures } = useQuery({
    queryKey: ['captures', 'mine'],
    queryFn: listMyCaptures,
  });

  const [handleDraft, setHandleDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.handle) setHandleDraft(profile.handle);
  }, [profile?.handle]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUploading(true);
      const path = await uploadAvatar(result.assets[0].uri);
      await updateMyProfile({ avatar_path: path });
      await refetchProfile();
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    } catch (err) {
      Alert.alert('Avatar upload failed', String(err));
    } finally {
      setUploading(false);
    }
  }

  async function saveHandle() {
    const trimmed = handleDraft.trim();
    if (!trimmed || trimmed === profile?.handle) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await updateMyProfile({ handle: trimmed });
      await refetchProfile();
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      setEditing(false);
    } catch (err) {
      Alert.alert(
        'Could not save name',
        String(err) + '\n\n(Names must be unique.)',
      );
    } finally {
      setSaving(false);
    }
  }

  const list: Capture[] = captures ?? [];
  const totalCaptures = list.length;
  const uniqueSpecies = new Set(list.map((c) => c.species_id)).size;
  const best = list.reduce<Capture | null>(
    (acc, c) => (acc && acc.final_score >= c.final_score ? acc : c),
    null,
  );
  const tierCounts = list.reduce<Record<Tier, number>>(
    (acc, c) => {
      acc[c.tier] = (acc[c.tier] ?? 0) + 1;
      return acc;
    },
    { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
  );

  const avatarUri = avatarPublicUrl(profile?.avatar_path ?? null);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.hero}>
        <Pressable onPress={pickAvatar} disabled={uploading}>
          <Avatar uri={avatarUri} handle={profile?.handle} size={104} />
          <View style={styles.avatarEdit}>
            <Text style={styles.avatarEditText}>
              {uploading ? '…' : 'edit'}
            </Text>
          </View>
        </Pressable>

        {editing ? (
          <View style={styles.handleEditRow}>
            <TextInput
              value={handleDraft}
              onChangeText={setHandleDraft}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={32}
              style={styles.handleInput}
              placeholder="your name"
              placeholderTextColor={palette.smoke}
              onSubmitEditing={saveHandle}
            />
            <Pressable
              style={styles.saveBtn}
              onPress={saveHandle}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={palette.voidBlack} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={styles.handle}>{profile?.handle ?? 'wanderer'}</Text>
            <Text style={styles.tapToEdit}>tap to rename</Text>
          </Pressable>
        )}

        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>

      <View style={styles.statRow}>
        <Stat label="Captures" value={String(totalCaptures)} />
        <Stat label="Species" value={String(uniqueSpecies)} />
        <Stat
          label="Best score"
          value={best ? String(Math.round(best.final_score)) : '—'}
        />
      </View>

      <Text style={styles.sectionHead}>· Tier Reliquary ·</Text>
      <View style={styles.tierGrid}>
        {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as Tier[]).map(
          (t) => {
            const tt = tierTheme[t];
            return (
              <View
                key={t}
                style={[
                  styles.tierCell,
                  { borderColor: tt.primary, backgroundColor: tt.deep },
                ]}
              >
                <Text style={[styles.tierName, { color: tt.textOnFrame }]}>
                  {tt.label}
                </Text>
                <Text style={[styles.tierCount, { color: tt.textOnFrame }]}>
                  {tierCounts[t]}
                </Text>
              </View>
            );
          },
        )}
      </View>

      <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.voidBlack },
  content: { padding: 22, gap: 18, paddingBottom: 60 },
  hero: { alignItems: 'center', gap: 10, marginTop: 12 },
  avatarEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: palette.voidBlack,
    borderColor: palette.aetherGold,
    borderWidth: 1,
    borderRadius: 999,
  },
  avatarEditText: {
    color: palette.aetherGold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: font.title,
  },
  handle: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '800',
    fontSize: 26,
    textAlign: 'center',
    marginTop: 8,
  },
  tapToEdit: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  handleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  handleInput: {
    backgroundColor: palette.crypt,
    borderColor: palette.aetherGold,
    borderWidth: 1,
    color: palette.bone,
    fontFamily: font.title,
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 180,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: palette.aetherGold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  saveBtnText: {
    color: palette.voidBlack,
    fontFamily: font.title,
    fontWeight: '800',
    letterSpacing: 1,
  },
  email: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 12,
  },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  stat: {
    flex: 1,
    backgroundColor: palette.crypt,
    borderColor: palette.fog,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    color: palette.bone,
    fontFamily: font.title,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: palette.smoke,
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sectionHead: {
    color: palette.aetherGold,
    fontFamily: font.title,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 14,
  },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tierCell: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  tierName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: font.title,
  },
  tierCount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    fontFamily: font.title,
  },
  signOut: {
    marginTop: 24,
    backgroundColor: palette.crypt,
    borderColor: palette.danger,
    borderWidth: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: palette.danger,
    fontFamily: font.title,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
