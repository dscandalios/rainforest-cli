import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, tierColors } from '../lib/colors';
import { huntingMeta } from '../lib/huntingStyles';
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
      hunting_style?: string | null;
    };
  };
  compact?: boolean;
}

// Decorative corner bracket — four rotated copies sit at the corners of the
// outer frame.
function Corner({ color, rotation }: { color: string; rotation: number }) {
  return (
    <View
      style={[
        styles.corner,
        {
          borderTopColor: color,
          borderLeftColor: color,
          transform: [{ rotate: `${rotation}deg` }],
        },
      ]}
    />
  );
}

export function SpiderCard({ capture, compact }: Props) {
  const tier: Tier = capture.tier;
  const tc = tierColors[tier];
  const hm = huntingMeta(capture.species.hunting_style);

  const foilActive = tier === 'epic' || tier === 'legendary';
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    if (!foilActive) return;
    shimmer.value = -1;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [foilActive, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * 320 }, { rotate: '18deg' }],
    opacity: 0.16,
  }));

  // tier-themed gradients
  const frameStart = mix(tc.fg, '#000', 0.55);
  const frameEnd = mix(tc.fg, '#000', 0.85);
  const headerStart = mix(tc.bg, tc.glow, 0.25);
  const headerEnd = mix(tc.bg, '#000', 0.35);
  const bezelStart = tc.fg;
  const bezelEnd = mix(tc.fg, '#000', 0.6);

  return (
    <View style={[styles.outer, { shadowColor: tc.glow }]}>
      <LinearGradient
        colors={[frameStart, frameEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        {/* corner brackets */}
        <Corner color={tc.fg} rotation={0} />
        <View style={styles.cornerTR}><Corner color={tc.fg} rotation={90} /></View>
        <View style={styles.cornerBL}><Corner color={tc.fg} rotation={270} /></View>
        <View style={styles.cornerBR}><Corner color={tc.fg} rotation={180} /></View>

        <View style={[styles.card, { backgroundColor: '#0f0f17' }]}>
          {/* HEADER ───────────────────────────── */}
          <LinearGradient
            colors={[headerStart, headerEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={[styles.headerPip, { color: tc.fg }]}>◆</Text>
            <View style={styles.headerTitleWrap}>
              <Text
                style={[styles.headerTitle, { color: tc.fg }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {capture.species.common_name}
              </Text>
              <Text style={styles.headerSci} numberOfLines={1}>
                {capture.species.scientific_name}
              </Text>
            </View>
            <View style={[styles.hpBadge, { borderColor: tc.fg, backgroundColor: '#000' }]}>
              <Text style={[styles.hpLabel, { color: tc.fg }]}>HP</Text>
              <Text style={[styles.hpValue, { color: tc.fg }]}>{capture.hp}</Text>
            </View>
          </LinearGradient>

          {/* PHOTO + BEZEL ─────────────────────── */}
          <LinearGradient
            colors={[bezelStart, bezelEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.photoBezel}
          >
            <View style={styles.photoInner}>
              {capture.photoUrl ? (
                <Image source={{ uri: capture.photoUrl }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={{ color: colors.textDim }}>no photo</Text>
                </View>
              )}

              {/* foil shimmer overlay for epic / legendary */}
              {foilActive && (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <Animated.View style={[styles.shimmer, shimmerStyle]}>
                    <LinearGradient
                      colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.9)',
                        'rgba(255,255,255,0)',
                      ]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </View>
              )}

              {/* type pip — bottom-left of photo */}
              <View
                style={[
                  styles.typePip,
                  { backgroundColor: hm.color, borderColor: tc.fg },
                ]}
              >
                <Text style={[styles.typeGlyph, { color: hm.fg }]}>{hm.glyph}</Text>
                <Text style={[styles.typeAbbr, { color: hm.fg }]}>{hm.abbr}</Text>
              </View>

              {/* rarity stamp — top-right of photo */}
              <View
                style={[
                  styles.rarityStamp,
                  { borderColor: tc.fg, backgroundColor: 'rgba(0,0,0,0.6)' },
                ]}
              >
                <Text style={[styles.rarityStampText, { color: tc.fg }]}>
                  {tc.label.toUpperCase()}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ABILITIES ─────────────────────────── */}
          <View style={styles.body}>
            <View style={styles.abilityRow}>
              <View style={styles.abilityNameWrap}>
                <Text style={[styles.bullet, { color: tc.fg }]}>◆</Text>
                <Text style={[styles.abilityName, { color: tc.fg }]}>
                  {capture.species.ability_name}
                </Text>
              </View>
              <View style={[styles.dmgBadge, { borderColor: tc.fg }]}>
                <Text style={styles.dmgValue}>{capture.damage}</Text>
                <Text style={styles.dmgLabel}>DMG</Text>
              </View>
            </View>
            <Text style={styles.abilityText}>{capture.species.ability_text}</Text>

            {capture.species.ability2_name && capture.species.ability2_text ? (
              <>
                <LinearGradient
                  colors={['transparent', tc.fg, 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.divider}
                />
                <View style={styles.abilityRow}>
                  <View style={styles.abilityNameWrap}>
                    <Text style={[styles.bullet, { color: tc.fg }]}>◆</Text>
                    <Text style={[styles.abilityName, { color: tc.fg }]}>
                      {capture.species.ability2_name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.abilityText}>
                  {capture.species.ability2_text}
                </Text>
              </>
            ) : null}

            {!compact && capture.species.flavor_text ? (
              <View style={[styles.flavorBox, { borderLeftColor: tc.fg }]}>
                <Text style={styles.flavor}>
                  {`“${capture.species.flavor_text}”`}
                </Text>
              </View>
            ) : null}

            {capture.species.medically_significant &&
            capture.species.safety_note ? (
              <View style={styles.safety}>
                <Text style={styles.safetyText}>
                  ⚠ {capture.species.safety_note}
                </Text>
              </View>
            ) : null}
          </View>

          {/* FOOTER ────────────────────────────── */}
          <LinearGradient
            colors={[headerEnd, headerStart]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footer}
          >
            <View style={[styles.setStamp, { borderColor: tc.fg }]}>
              <Text style={[styles.setStampText, { color: tc.fg }]}>PNW</Text>
            </View>
            <Text style={[styles.footerHunt, { color: tc.fg }]}>
              {hm.label}
            </Text>
            <View style={styles.scoreWrap}>
              <Text style={styles.scoreLabel}>POWER</Text>
              <Text style={[styles.scoreValue, { color: tc.fg }]}>
                {Math.round(capture.final_score)}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

// Blend two hex colors by t in [0,1]. Light helper so we can compute
// tier-themed gradients without a color library.
function mix(a: string, b: string, t: number): string {
  const pa = parse(a);
  const pb = parse(b);
  const r = Math.round(pa[0] * (1 - t) + pb[0] * t);
  const g = Math.round(pa[1] * (1 - t) + pb[1] * t);
  const bl = Math.round(pa[2] * (1 - t) + pb[2] * t);
  return `rgb(${r},${g},${bl})`;
}

function parse(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const styles = StyleSheet.create({
  outer: {
    marginVertical: 10,
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  frame: {
    borderRadius: 22,
    padding: 4,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  // corners
  corner: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'white',
    borderTopLeftRadius: 6,
  },
  cornerTR: { position: 'absolute', top: 6, right: 6 },
  cornerBL: { position: 'absolute', bottom: 6, left: 6 },
  cornerBR: { position: 'absolute', bottom: 6, right: 6 },
  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  headerPip: { fontSize: 18 },
  headerTitleWrap: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: 0.3 },
  headerSci: { fontSize: 11, fontStyle: 'italic', color: '#cfcfd8' },
  hpBadge: {
    minWidth: 64,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
  },
  hpLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  hpValue: { fontSize: 22, fontWeight: '900' },
  // photo
  photoBezel: { padding: 5 },
  photoInner: { borderRadius: 4, overflow: 'hidden', backgroundColor: '#000' },
  photo: { width: '100%', aspectRatio: 1.15, backgroundColor: '#000' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  shimmer: {
    position: 'absolute',
    top: -40,
    left: -160,
    width: 160,
    height: '160%',
  },
  typePip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  typeGlyph: { fontSize: 14, fontWeight: '700' },
  typeAbbr: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  rarityStamp: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  rarityStampText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  // body
  body: { padding: 14, gap: 6, backgroundColor: '#0f0f17' },
  abilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  abilityNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  bullet: { fontSize: 14 },
  abilityName: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3, flex: 1 },
  abilityText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginLeft: 22,
  },
  dmgBadge: {
    minWidth: 56,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#1a0f12',
  },
  dmgValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  dmgLabel: { color: '#ff8a8a', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 10, opacity: 0.55 },
  flavorBox: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
  },
  flavor: {
    fontSize: 12,
    color: colors.textDim,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  safety: {
    marginTop: 10,
    backgroundColor: '#3a1010',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  safetyText: { color: '#ffd6d6', fontSize: 12 },
  // footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  setStamp: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  setStampText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  footerHunt: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.85,
  },
  scoreWrap: { alignItems: 'flex-end' },
  scoreLabel: { color: '#9a9aaa', fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  scoreValue: { fontSize: 20, fontWeight: '900' },
});
