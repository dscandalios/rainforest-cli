import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TierBadge } from '../../src/components/TierBadge';
import { listMyCaptures } from '../../src/lib/api';
import { colors } from '../../src/lib/colors';
import { signedPhotoUrl } from '../../src/lib/supabase';
import type { Capture } from '../../src/types';
import { Image } from 'react-native';

export default function CollectionScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['captures', 'mine'],
    queryFn: listMyCaptures,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigText}>No spiders yet</Text>
        <Text style={styles.dim}>Capture your first spider on the Capture tab.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      numColumns={2}
      contentContainerStyle={{ padding: 8 }}
      keyExtractor={(c) => c.id}
      onRefresh={refetch}
      refreshing={isRefetching}
      renderItem={({ item }) => (
        <CollectionTile capture={item} onPress={() => router.push(`/card/${item.id}`)} />
      )}
    />
  );
}

function CollectionTile({
  capture,
  onPress,
}: {
  capture: Capture;
  onPress: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    signedPhotoUrl(capture.photo_path).then((u) => {
      if (live) setUrl(u);
    });
    return () => {
      live = false;
    };
  }, [capture.photo_path]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.7 }]}
    >
      {url ? (
        <Image source={{ uri: url }} style={styles.tileImage} />
      ) : (
        <View style={[styles.tileImage, { backgroundColor: '#000' }]} />
      )}
      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {capture.species?.common_name ?? 'Unknown'}
        </Text>
        <View style={styles.tileFooter}>
          <TierBadge tier={capture.tier} />
          <Text style={styles.tileScore}>{Math.round(capture.final_score)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
    gap: 8,
  },
  bigText: { color: colors.text, fontSize: 20, fontWeight: '700' },
  dim: { color: colors.textDim, textAlign: 'center' },
  tile: {
    flex: 1,
    margin: 6,
    backgroundColor: colors.bgElev,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tileImage: { width: '100%', aspectRatio: 1 },
  tileMeta: { padding: 8, gap: 6 },
  tileName: { color: colors.text, fontWeight: '600' },
  tileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileScore: { color: colors.textDim, fontWeight: '700' },
});
