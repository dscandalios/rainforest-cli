import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { font, palette } from '../lib/theme';

interface Props {
  uri?: string | null;
  handle?: string | null;
  size?: number;
  ring?: boolean;
}

export function Avatar({ uri, handle, size = 48, ring = true }: Props) {
  const initial = (handle?.trim()?.[0] ?? '?').toUpperCase();
  const radius = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {ring && (
        <LinearGradient
          colors={[palette.aetherGold, palette.arcane, palette.aetherGold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius, opacity: 0.7 },
          ]}
        />
      )}
      <View
        style={[
          styles.inner,
          {
            width: size - (ring ? 4 : 0),
            height: size - (ring ? 4 : 0),
            borderRadius: (size - (ring ? 4 : 0)) / 2,
            margin: ring ? 2 : 0,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} />
        ) : (
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    overflow: 'hidden',
    backgroundColor: palette.crypt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.fog,
  },
  initial: {
    color: palette.bone,
    fontFamily: font.title,
    fontWeight: '800',
  },
});
