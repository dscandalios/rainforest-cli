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
import { huntingMeta } from '../lib/huntingStyles';
import { font, palette, radius, tierTheme } from '../lib/theme';
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
  detail?: boolean; // detail screen shows more (full flavor, second ability)
}

// Shorten ability text to one tight rules clause for the card face.
// The detail screen shows the full text untouched.
function compactRule(text: string, max = 110): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastDot = slice.lastIndexOf('.');
  if (lastDot > 40) return slice.slice(0, lastDot + 1);
  const lastSpace = slice.lastIndexOf(' ');
  return slice.slice(0, lastSpace) + '…';
}

function compactFlavor(text: string): string {
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return firstSentence.length > 120
    ? firstSentence.slice(0, 117) + '…'
    : firstSentence;
}

// Render the "Legendary Spider — Orb-weaver" type line.
function typeLine(species: Props['capture']['species'], tier: Tier): string {
  const hm = huntingMeta(species.hunting_style);
  const prefix = tier === 'legendary' ? 'Legendary Spider' : 'Spider';
  return `${prefix} — ${hm.label}`;
}

export function SpiderCard({ capture, detail }: Props) {
  const tier: Tier = capture.tier;
  const tt = tierTheme[tier];
  const foilActive = tier === 'epic' || tier === 'legendary';
  const shimmer = useSharedValue(-1);

  useEffect(() => {
    if (!foilActive) return;
    shimmer.value = -1;
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [foilActive, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * 360 }, { rotate: '20deg' }],
    opacity: 0.18,
  }));

  return (
    <View style={[styles.outerShadow, { shadowColor: tt.glow }]}>
      {/* ── Outer ornamental frame (gradient, simulates beveled metal) ── */}
      <LinearGradient
        colors={[palette.voidBlack, palette.obsidian, palette.voidBlack]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        {/* ── Subtle marbled vertical strips on the long edges ── */}
        <LinearGradient
          pointerEvents="none"
          colors={[palette.fog, 'transparent', palette.fog]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.frameSheen}
        />

        {/* ── TITLE BAR ── */}
        <View style={styles.titleBar}>
          <LinearGradient
            colors={[palette.crypt, palette.ash, palette.crypt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text
            style={styles.titleText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {capture.species.common_name}
          </Text>
          <View style={[styles.hpPill, { borderColor: tt.accent }]}>
            <Text style={[styles.hpLabel, { color: tt.accent }]}>HP</Text>
            <Text style={styles.hpValue}>{capture.hp}</Text>
          </View>
        </View>

        {/* ── ART WINDOW ── */}
        <View style={styles.artFrame}>
          <View style={styles.artInner}>
            {capture.photoUrl ? (
              <Image source={{ uri: capture.photoUrl }} style={styles.art} />
            ) : (
              <View style={[styles.art, styles.artPlaceholder]}>
                <Text style={{ color: palette.smoke }}>no photo</Text>
              </View>
            )}

            {/* Vignette */}
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(0,0,0,0.65)',
                'transparent',
                'transparent',
                'rgba(0,0,0,0.55)',
              ]}
              locations={[0, 0.2, 0.75, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Foil shimmer for epic/legendary */}
            {foilActive && (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Animated.View style={[styles.shimmer, shimmerStyle]}>
                  <LinearGradient
                    colors={[
                      'rgba(255,235,180,0)',
                      'rgba(255,235,180,0.85)',
                      'rgba(255,235,180,0)',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            )}
          </View>
        </View>

        {/* ── TYPE LINE ── */}
        <View style={styles.typeBar}>
          <LinearGradient
            colors={[palette.crypt, palette.ash, palette.crypt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.typeText} numberOfLines={1}>
            {typeLine(capture.species, tier)}
          </Text>
          <View
            style={[
              styles.setGem,
              { backgroundColor: tt.primary, borderColor: tt.accent },
            ]}
          />
        </View>

        {/* ── RULES BOX (parchment) ── */}
        <View style={styles.rulesBox}>
          <LinearGradient
            colors={['#dcd2b6', '#c4b89a', '#d6cab0']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.ruleHeadRow}>
            <Text style={styles.abilityName}>
              {capture.species.ability_name}
            </Text>
          </View>
          <Text style={styles.rulesText}>
            {detail
              ? capture.species.ability_text
              : compactRule(capture.species.ability_text)}
          </Text>

          {detail &&
          capture.species.ability2_name &&
          capture.species.ability2_text ? (
            <>
              <View style={styles.rulesDivider} />
              <Text style={styles.abilityName}>
                {capture.species.ability2_name}
              </Text>
              <Text style={styles.rulesText}>
                {capture.species.ability2_text}
              </Text>
            </>
          ) : null}

          {capture.species.flavor_text ? (
            <>
              <View style={styles.flavorDivider} />
              <Text style={styles.flavor}>
                {detail
                  ? `“${capture.species.flavor_text}”`
                  : `“${compactFlavor(capture.species.flavor_text)}”`}
              </Text>
            </>
          ) : null}

          {capture.species.medically_significant &&
          capture.species.safety_note ? (
            <View style={styles.safety}>
              <Text style={styles.safetyText}>
                ⚠ {capture.species.safety_note}
              </Text>
            </View>
          ) : null}

          {/* Damage badge — bottom-right inside rules box */}
          <View
            style={[
              styles.dmgBadge,
              { backgroundColor: tt.deep, borderColor: tt.accent },
            ]}
          >
            <Text style={[styles.dmgValue, { color: tt.textOnFrame }]}>
              {capture.damage}
            </Text>
            <Text style={[styles.dmgLabel, { color: tt.accent }]}>DMG</Text>
          </View>
        </View>

        {/* ── BOTTOM CAPTION (set / rarity / sci name) ── */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>
            PNW · {Math.round(capture.final_score)} ·{' '}
            <Text style={{ color: tt.accent }}>{tt.label.toUpperCase()}</Text>
          </Text>
          <Text style={styles.bottomTextRight} numberOfLines={1}>
            {capture.species.scientific_name}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    marginVertical: 12,
    shadowOpacity: 0.85,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  frame: {
    borderRadius: radius.xl,
    padding: 8,
    borderWidth: 1,
    borderColor: palette.crypt,
    overflow: 'hidden',
  },
  frameSheen: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    opacity: 0.5,
  },
  // title bar
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.fog,
    overflow: 'hidden',
    gap: 8,
  },
  titleText: {
    flex: 1,
    fontFamily: font.title,
    fontWeight: '700',
    fontSize: 19,
    color: palette.bone,
    letterSpacing: 0.3,
  },
  hpPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: palette.voidBlack,
  },
  hpLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  hpValue: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.bone,
    fontFamily: font.title,
  },
  // art window
  artFrame: {
    marginTop: 6,
    padding: 4,
    backgroundColor: palette.voidBlack,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.fog,
  },
  artInner: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  art: { width: '100%', aspectRatio: 1.05, backgroundColor: '#000' },
  artPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  shimmer: {
    position: 'absolute',
    top: -60,
    left: -200,
    width: 180,
    height: '180%',
  },
  // type bar
  typeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.fog,
    overflow: 'hidden',
    gap: 8,
  },
  typeText: {
    flex: 1,
    fontFamily: font.title,
    fontWeight: '700',
    fontSize: 13,
    color: palette.bone,
    letterSpacing: 0.4,
  },
  setGem: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  // rules box (parchment)
  rulesBox: {
    marginTop: 6,
    minHeight: 130,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 44, // room for damage badge
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.crypt,
    overflow: 'hidden',
  },
  ruleHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  abilityName: {
    fontFamily: font.title,
    fontWeight: '700',
    fontSize: 15,
    color: '#1a1410',
    marginBottom: 3,
  },
  rulesText: {
    fontFamily: font.serif,
    fontSize: 13,
    color: '#241c14',
    lineHeight: 18,
  },
  rulesDivider: {
    marginVertical: 8,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#7a6e54',
    opacity: 0.6,
  },
  flavorDivider: {
    marginTop: 10,
    marginBottom: 6,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#7a6e54',
    opacity: 0.4,
  },
  flavor: {
    fontFamily: font.serif,
    fontSize: 12,
    color: '#3a2e20',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  safety: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#3a1010',
    borderColor: palette.danger,
    borderWidth: 1,
    borderRadius: 6,
  },
  safetyText: { color: '#ffd6d6', fontSize: 11 },
  dmgBadge: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  dmgValue: { fontSize: 22, fontWeight: '900', fontFamily: font.title },
  dmgLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  // bottom caption
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 2,
  },
  bottomText: {
    fontSize: 10,
    color: palette.smoke,
    letterSpacing: 1,
    fontWeight: '700',
  },
  bottomTextRight: {
    flexShrink: 1,
    fontSize: 10,
    color: palette.smoke,
    fontStyle: 'italic',
    marginLeft: 12,
  },
});
