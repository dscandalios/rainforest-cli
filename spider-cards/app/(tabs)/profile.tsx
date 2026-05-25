import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { listMyCaptures } from '../../src/lib/api';
import { colors, tierColors } from '../../src/lib/colors';
import { supabase } from '../../src/lib/supabase';
import type { Capture, Tier } from '../../src/types';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    (async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return;
      const { data } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', u.id)
        .maybeSingle();
      setHandle(data?.handle ?? null);
    })();
  }, []);

  const { data: captures } = useQuery({
    queryKey: ['captures', 'mine'],
    queryFn: listMyCaptures,
  });

  const list: Capture[] = captures ?? [];
  const totalCaptures = list.length;
  const uniqueSpecies = new Set(list.map((c: Capture) => c.species_id)).size;
  const best = list.reduce<Capture | null>(
    (acc: Capture | null, c: Capture) =>
      acc && acc.final_score >= c.final_score ? acc : c,
    null,
  );
  const tierCounts = list.reduce<Record<Tier, number>>(
    (acc: Record<Tier, number>, c: Capture) => {
      acc[c.tier] = (acc[c.tier] ?? 0) + 1;
      return acc;
    },
    { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.handle}>@{handle ?? '—'}</Text>
      <Text style={styles.email}>{email ?? ''}</Text>

      <View style={styles.statRow}>
        <Stat label="Captures" value={String(totalCaptures)} />
        <Stat label="Species" value={String(uniqueSpecies)} />
        <Stat
          label="Best score"
          value={best ? String(Math.round(best.final_score)) : '—'}
        />
      </View>

      <Text style={styles.subhead}>Tier breakdown</Text>
      <View style={styles.tierGrid}>
        {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as Tier[]).map(
          (t) => (
            <View
              key={t}
              style={[
                styles.tierCell,
                { backgroundColor: tierColors[t].bg, borderColor: tierColors[t].fg },
              ]}
            >
              <Text style={[styles.tierName, { color: tierColors[t].fg }]}>
                {tierColors[t].label}
              </Text>
              <Text style={[styles.tierCount, { color: tierColors[t].fg }]}>
                {tierCounts[t]}
              </Text>
            </View>
          ),
        )}
      </View>

      <Pressable
        style={styles.signOut}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
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
  wrap: { flex: 1, padding: 20, backgroundColor: colors.bg, gap: 14 },
  handle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  email: { color: colors.textDim, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  subhead: { color: colors.text, fontWeight: '700', marginTop: 12 },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tierCell: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  tierName: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tierCount: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  signOut: {
    marginTop: 'auto',
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: { color: colors.danger, fontWeight: '700' },
});
