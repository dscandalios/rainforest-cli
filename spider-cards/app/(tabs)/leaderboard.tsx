import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Avatar } from '../../src/components/Avatar';
import {
  avatarPublicUrl,
  getLeaderboard,
  getMyLeaderboard,
  type LeaderboardEntry,
} from '../../src/lib/api';
import { font, palette, tierTheme } from '../../src/lib/theme';
import type { Tier } from '../../src/types';

type Scope = 'global' | 'mine';

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<Scope>('global');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: scope === 'global' ? getLeaderboard : getMyLeaderboard,
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>· THE HUNT ·</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.segmentWrap}>
        <SegmentBtn
          label="Mine"
          active={scope === 'mine'}
          onPress={() => setScope('mine')}
        />
        <SegmentBtn
          label="Global"
          active={scope === 'global'}
          onPress={() => setScope('global')}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.aetherGold} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          contentContainerStyle={styles.listContent}
          keyExtractor={(e) => e.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                {scope === 'mine'
                  ? 'No captures yet. The bestiary stands empty.'
                  : 'The hunters have yet to walk these woods.'}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Row entry={item} rank={index + 1} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

function SegmentBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.segmentBtn}>
      {active ? (
        <LinearGradient
          colors={[palette.aetherGold, palette.ember]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text
        style={[
          styles.segmentText,
          active && { color: palette.voidBlack },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Row({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const tt = tierTheme[entry.tier as Tier];
  return (
    <View
      style={[
        styles.row,
        { borderColor: tt.primary, backgroundColor: palette.crypt },
      ]}
    >
      <View style={styles.rankWrap}>
        <Text style={[styles.rankNum, { color: tt.accent }]}>
          {rank.toString().padStart(2, '0')}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.species, { color: tt.textOnFrame }]} numberOfLines={1}>
          {entry.common_name}
        </Text>
        <Text style={styles.sci} numberOfLines={1}>
          {entry.scientific_name}
        </Text>
        <View style={styles.bylineRow}>
          <Avatar
            uri={avatarPublicUrl(entry.avatar_path)}
            handle={entry.handle}
            size={20}
            ring={false}
          />
          <Text style={styles.byline} numberOfLines={1}>
            by {entry.handle}
            {entry.city ? ` · ${entry.city}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.scoreWrap}>
        <Text style={[styles.scoreLabel, { color: tt.accent }]}>
          {tt.label.toUpperCase()}
        </Text>
        <Text style={styles.scoreValue}>
          {Math.round(entry.final_score)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.voidBlack },
  headerWrap: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    color: palette.aetherGold,
    fontFamily: font.title,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 5,
    opacity: 0.85,
  },
  title: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: 1,
  },
  rule: {
    width: 60,
    height: 1,
    backgroundColor: palette.aetherGold,
    opacity: 0.5,
    marginTop: 4,
  },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
    borderColor: palette.aetherGold,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  segmentText: {
    color: palette.aetherGold,
    fontFamily: font.title,
    fontWeight: '800',
    letterSpacing: 3,
    fontSize: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  empty: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14,
  },
  listContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 40 },
  sep: { height: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  rankWrap: { width: 30, alignItems: 'center' },
  rankNum: {
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 16,
  },
  species: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  sci: {
    color: palette.parchment,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 11,
    opacity: 0.85,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  byline: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  scoreWrap: { alignItems: 'flex-end', gap: 2, minWidth: 70 },
  scoreLabel: {
    fontFamily: font.title,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  scoreValue: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 22,
  },
});
