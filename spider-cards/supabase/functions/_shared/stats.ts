// Shared stat-computation helpers — kept in sync with the client-side
// version in src/lib/stats.ts. Identical math, but the server version is
// the authoritative one for persisted captures.

export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export function rawPowerScore(parts: {
  venom_score: number;
  size_score: number;
  ability_uniqueness: number;
  speed_score: number;
  aggression_score: number;
}): number {
  return (
    0.3 * parts.venom_score +
    0.25 * parts.size_score +
    0.2 * parts.ability_uniqueness +
    0.15 * parts.speed_score +
    0.1 * parts.aggression_score
  );
}

export function tierForScore(score: number): Tier {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'epic';
  if (score >= 60) return 'rare';
  if (score >= 40) return 'uncommon';
  return 'common';
}

export function hpForScore(score: number, conditionMod: number): number {
  return Math.round((50 + score * 2.5) * conditionMod);
}

export function damageForScore(score: number, conditionMod: number): number {
  return Math.round((10 + score * 1.1) * conditionMod);
}

// Map a photo-quality 0..1 to a condition modifier in [0.97, 1.03].
export function conditionModifier(quality: number): number {
  const clamped = Math.max(0, Math.min(1, quality));
  return Number((0.97 + clamped * 0.06).toFixed(3));
}
