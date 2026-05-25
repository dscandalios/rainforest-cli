import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/colors';

export function FramingOverlay() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.frame} />
      <View style={styles.tipsWrap}>
        <Text style={styles.tip}>get close — fill the frame</Text>
        <Text style={styles.tip}>steady, good light</Text>
        <Text style={styles.tip}>do not handle medically significant species</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '78%',
    aspectRatio: 1,
    borderColor: colors.accent,
    borderWidth: 2,
    borderRadius: 16,
    opacity: 0.6,
  },
  tipsWrap: {
    position: 'absolute',
    bottom: 140,
    alignItems: 'center',
    gap: 4,
  },
  tip: {
    color: colors.text,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
