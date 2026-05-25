import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, tierColors } from '../lib/colors';
import type { Capture, Tier } from '../types';

interface Props {
  capture: Pick<
    Capture,
    'hp' | 'damage' | 'tier' | 'final_score' | 'photo_path'
  > & {
    photoUrl?: string | null;
    species: {
      common_name: string;
      scientific_name: string;
      ability_name: string;
      ability_text: string;
      ability2_name: string | null;
      ability2_text: string | null;
      flavor_text: string;
      medically_significant: boolean;
      safety_note: string | null;
    };
  };
  compact?: boolean;
}

export function SpiderCard({ capture, compact }: Props) {
  const tier: Tier = capture.tier;
  const tc = tierColors[tier];

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: tc.fg,
          shadowColor: tc.glow,
          backgroundColor: colors.bgElev,
        },
        compact && styles.cardCompact,
      ]}
    >
      <View style={[styles.header, { backgroundColor: tc.bg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: tc.fg }]} numberOfLines={1}>
            {capture.species.common_name}
          </Text>
          <Text style={styles.sciName} numberOfLines={1}>
            {capture.species.scientific_name}
          </Text>
        </View>
        <View style={styles.hpWrap}>
          <Text style={styles.hpLabel}>HP</Text>
          <Text style={styles.hpValue}>{capture.hp}</Text>
        </View>
      </View>

      {capture.photoUrl ? (
        <Image source={{ uri: capture.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={{ color: colors.textDim }}>no photo</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.abilityRow}>
          <Text style={[styles.abilityName, { color: tc.fg }]}>
            {capture.species.ability_name}
          </Text>
          <Text style={styles.damageBadge}>{capture.damage}</Text>
        </View>
        <Text style={styles.abilityText}>{capture.species.ability_text}</Text>

        {capture.species.ability2_name && capture.species.ability2_text ? (
          <>
            <View style={styles.abilityRow}>
              <Text style={[styles.abilityName, { color: tc.fg }]}>
                {capture.species.ability2_name}
              </Text>
            </View>
            <Text style={styles.abilityText}>
              {capture.species.ability2_text}
            </Text>
          </>
        ) : null}

        {!compact && (
          <Text style={styles.flavor}>{capture.species.flavor_text}</Text>
        )}

        {capture.species.medically_significant && capture.species.safety_note ? (
          <View style={styles.safety}>
            <Text style={styles.safetyText}>
              ⚠ {capture.species.safety_note}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={[styles.tierLabel, { color: tc.fg }]}>
            {tc.label} · score {Math.round(capture.final_score)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    marginVertical: 8,
  },
  cardCompact: {
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  name: { fontSize: 18, fontWeight: '700' },
  sciName: { fontSize: 12, fontStyle: 'italic', color: colors.textDim },
  hpWrap: { alignItems: 'flex-end' },
  hpLabel: { fontSize: 10, color: colors.textDim, letterSpacing: 1 },
  hpValue: { fontSize: 22, color: colors.text, fontWeight: '800' },
  photo: { width: '100%', aspectRatio: 1.2, backgroundColor: '#000' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 12, gap: 6 },
  abilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  abilityName: { fontSize: 14, fontWeight: '700' },
  damageBadge: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: '#3a1f24',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  abilityText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  flavor: {
    fontSize: 12,
    color: colors.textDim,
    fontStyle: 'italic',
    marginTop: 6,
  },
  safety: {
    marginTop: 8,
    backgroundColor: '#3a1010',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  safetyText: { color: '#ffd6d6', fontSize: 12 },
  footer: { marginTop: 8 },
  tierLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
