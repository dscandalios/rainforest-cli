import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tierColors } from '../lib/colors';
import type { Tier } from '../types';

export function TierBadge({ tier }: { tier: Tier }) {
  const tc = tierColors[tier];
  return (
    <View style={[styles.badge, { backgroundColor: tc.bg, borderColor: tc.fg }]}>
      <Text style={[styles.label, { color: tc.fg }]}>{tc.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
