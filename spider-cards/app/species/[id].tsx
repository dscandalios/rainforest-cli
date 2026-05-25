import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TierBadge } from '../../src/components/TierBadge';
import { colors } from '../../src/lib/colors';
import { supabase } from '../../src/lib/supabase';
import type { Tier } from '../../src/types';

export default function SpeciesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['species', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textDim }}>Species not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{data.common_name}</Text>
          <Text style={styles.sciName}>{data.scientific_name}</Text>
        </View>
        <TierBadge tier={(data.tier as Tier) ?? 'common'} />
      </View>

      <Text style={styles.flavor}>{data.flavor_text}</Text>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>{data.ability_name}</Text>
        <Text style={styles.boxText}>{data.ability_text}</Text>
      </View>

      {data.ability2_name ? (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>{data.ability2_name}</Text>
          <Text style={styles.boxText}>{data.ability2_text}</Text>
        </View>
      ) : null}

      {data.medically_significant && data.safety_note ? (
        <View style={[styles.box, styles.safety]}>
          <Text style={styles.safetyTitle}>Safety</Text>
          <Text style={styles.boxText}>{data.safety_note}</Text>
        </View>
      ) : null}

      <View style={styles.statGrid}>
        <Stat label="Venom" value={data.venom_score} />
        <Stat label="Size" value={data.size_score} />
        <Stat label="Speed" value={data.speed_score} />
        <Stat label="Aggression" value={data.aggression_score} />
        <Stat label="Uniqueness" value={data.ability_uniqueness} />
        <Stat
          label="Calibrated"
          value={data.calibrated_score}
          highlight
        />
      </View>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.stat, highlight && { borderColor: colors.accent }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value !== null && value !== undefined ? Math.round(value) : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sciName: { color: colors.textDim, fontStyle: 'italic' },
  flavor: { color: colors.textDim, fontStyle: 'italic' },
  box: {
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  boxTitle: { color: colors.text, fontWeight: '700' },
  boxText: { color: colors.text },
  safety: { borderColor: colors.danger },
  safetyTitle: { color: colors.danger, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: { color: colors.textDim, fontSize: 11 },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 4 },
});
