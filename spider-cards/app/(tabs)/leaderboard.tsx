import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { TierBadge } from '../../src/components/TierBadge';
import { getLeaderboard } from '../../src/lib/api';
import { colors } from '../../src/lib/colors';
import type { Tier } from '../../src/types';

export default function LeaderboardScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
      keyExtractor={(e) => e.id}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        <Text style={styles.title}>Top Spiders — global</Text>
      }
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.common_name}</Text>
            <Text style={styles.sciName}>{item.scientific_name}</Text>
            <Text style={styles.byline}>
              by @{item.handle}
              {item.city ? ` · ${item.city}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <TierBadge tier={item.tier as Tier} />
            <Text style={styles.score}>{Math.round(item.final_score)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  rank: { color: colors.textDim, fontWeight: '800', width: 40 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  sciName: { color: colors.textDim, fontStyle: 'italic', fontSize: 12 },
  byline: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  score: { color: colors.text, fontWeight: '800', fontSize: 18 },
});
