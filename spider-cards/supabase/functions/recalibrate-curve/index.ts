// recalibrate-curve — runs nightly (configure as a Supabase scheduled function
// or cron-trigger from an external scheduler).
//
// Reads all species + observation counts for the active region (default
// 'oregon'), then maps each species' raw_power_score onto a bell curve where
// the *observation-weighted median species* lands at ~50 with a std-dev of
// ~15. This means: the most-photographed-by-Oregonians spider sits squarely
// in the middle, and rare visitors sit in the tails — exactly what the user
// asked for.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { tierForScore } from '../_shared/stats.ts';

const REGION = Deno.env.get('RECALIBRATION_REGION') ?? 'oregon';
const TARGET_MEAN = 50;
const TARGET_STD = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Pull species with their observation counts for this region.
  const { data: species, error } = await supabase
    .from('species')
    .select(
      'id, raw_power_score, species_observation_count!left(count, region)',
    );
  if (error || !species) {
    return new Response(JSON.stringify({ ok: false, error }), { status: 500 });
  }

  // Build weighted samples — one synthetic sample per observation.
  // (For very large datasets you'd compute the weighted CDF directly without
  // materializing samples, but at <10k species this is fine.)
  const weighted: { id: string; raw: number; weight: number }[] = [];
  for (const s of species) {
    const count =
      (s.species_observation_count as { count: number; region: string }[] | null)
        ?.filter((r) => r.region === REGION)
        ?.reduce((a, r) => a + r.count, 0) ?? 0;
    // Give every species weight 1 baseline so day-zero curve isn't degenerate.
    weighted.push({ id: s.id, raw: s.raw_power_score ?? 30, weight: count + 1 });
  }

  // Compute weighted mean and std-dev of raw_power_score.
  const totalW = weighted.reduce((a, w) => a + w.weight, 0);
  const mean =
    weighted.reduce((a, w) => a + w.raw * w.weight, 0) / totalW;
  const variance =
    weighted.reduce((a, w) => a + w.weight * (w.raw - mean) ** 2, 0) / totalW;
  const std = Math.sqrt(variance) || 1;

  // Map each species' raw score onto the target distribution.
  const updates = weighted.map(({ id, raw }) => {
    const z = (raw - mean) / std;
    const calibrated = clamp(TARGET_MEAN + z * TARGET_STD, 1, 100);
    return {
      id,
      calibrated: Number(calibrated.toFixed(2)),
      tier: tierForScore(calibrated),
    };
  });

  // Batch upsert. (Supabase has no bulk-update by id helper, so we issue one
  // update per species. With <50 species this is fine; at scale, switch to a
  // single UPDATE … FROM (VALUES …) via rpc.)
  for (const u of updates) {
    await supabase
      .from('species')
      .update({
        calibrated_score: u.calibrated,
        tier: u.tier,
        last_calibrated_at: new Date().toISOString(),
      })
      .eq('id', u.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      region: REGION,
      species_count: updates.length,
      total_observations: totalW - updates.length,
      mean,
      std,
    }),
    {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    },
  );
});

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
