import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { listMyCaptures } from '../../src/lib/api';
import { signedPhotoUrl } from '../../src/lib/supabase';
import { font, palette, tierTheme } from '../../src/lib/theme';
import type { Capture, Tier } from '../../src/types';

export default function CollectionScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['captures', 'mine'],
    queryFn: listMyCaptures,
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.headerWrap}>
        <Text style={styles.eyebrow}>· YOUR BESTIARY ·</Text>
        <Text style={styles.title}>Collection</Text>
        <View style={styles.rule} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.aetherGold} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          keyExtractor={(c) => c.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>
                The pages of your bestiary are blank.{'\n'}
                Capture a spider to begin.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Tile capture={item} onPress={() => router.push(`/card/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function Tile({ capture, onPress }: { capture: Capture; onPress: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const tt = tierTheme[capture.tier as Tier];

  useEffect(() => {
    let live = true;
    signedPhotoUrl(capture.photo_path).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [capture.photo_path]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: tt.primary, shadowColor: tt.glow },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.tilePhotoWrap}>
        {url ? (
          <Image source={{ uri: url }} style={styles.tilePhoto} />
        ) : (
          <View style={[styles.tilePhoto, { backgroundColor: '#000' }]} />
        )}
        <View
          style={[
            styles.tileTierStamp,
            { borderColor: tt.accent, backgroundColor: 'rgba(0,0,0,0.65)' },
          ]}
        >
          <Text style={[styles.tileTierText, { color: tt.accent }]}>
            {tt.label.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {capture.species?.common_name ?? 'Unknown'}
        </Text>
        <View style={styles.tileFoot}>
          <Text style={styles.tileSci} numberOfLines={1}>
            {capture.species?.scientific_name ?? ''}
          </Text>
          <Text style={[styles.tileScore, { color: tt.accent }]}>
            {Math.round(capture.final_score)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.voidBlack },
  headerWrap: {
    paddingTop: 16,
    paddingBottom: 10,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 240,
  },
  empty: {
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  gridContent: { padding: 8, paddingBottom: 40 },
  tile: {
    flex: 1,
    margin: 6,
    backgroundColor: palette.crypt,
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tilePhotoWrap: { position: 'relative' },
  tilePhoto: { width: '100%', aspectRatio: 1 },
  tileTierStamp: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  tileTierText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: font.title,
  },
  tileMeta: { padding: 8, gap: 4 },
  tileName: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '800',
    fontSize: 13,
  },
  tileFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileSci: {
    flex: 1,
    color: palette.smoke,
    fontFamily: font.serif,
    fontStyle: 'italic',
    fontSize: 9,
  },
  tileScore: {
    fontFamily: font.title,
    fontWeight: '900',
    fontSize: 14,
  },
});
