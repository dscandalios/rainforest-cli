// Mirror of supabase/functions/_shared/stats.ts — kept in sync for client-side
// preview before the server confirms a capture.

import type { Tier } from '../types';

export function tierForScore(score: number): Tier {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'epic';
  if (score >= 60) return 'rare';
  if (score >= 40) return 'uncommon';
  return 'common';
}

export function hpForScore(score: number, conditionMod = 1): number {
  return Math.round((50 + score * 2.5) * conditionMod);
}

export function damageForScore(score: number, conditionMod = 1): number {
  return Math.round((10 + score * 1.1) * conditionMod);
}
