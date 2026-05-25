import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SpiderCard } from '../../src/components/SpiderCard';
import { getCapture } from '../../src/lib/api';
import { colors } from '../../src/lib/colors';
import { signedPhotoUrl } from '../../src/lib/supabase';

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: capture, isLoading } = useQuery({
    queryKey: ['capture', id],
    queryFn: () => getCapture(id!),
    enabled: !!id,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!capture) return;
    let live = true;
    signedPhotoUrl(capture.photo_path).then((u) => live && setPhotoUrl(u));
    return () => {
      live = false;
    };
  }, [capture]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!capture || !capture.species) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textDim }}>Card not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <SpiderCard
        capture={{
          hp: capture.hp,
          damage: capture.damage,
          tier: capture.tier,
          final_score: capture.final_score,
          photo_path: capture.photo_path,
          photoUrl,
          species: capture.species,
        }}
      />

      <View style={styles.meta}>
        <Row label="Captured" value={new Date(capture.captured_at).toLocaleString()} />
        {capture.city ? <Row label="City" value={capture.city} /> : null}
        <Row
          label="Confidence"
          value={`${Math.round(capture.confidence * 100)}%`}
        />
        <Row
          label="Condition modifier"
          value={`${(capture.condition_modifier * 100).toFixed(1)}%`}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 14, gap: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  meta: {
    padding: 12,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.textDim },
  rowValue: { color: colors.text, fontWeight: '600' },
});
