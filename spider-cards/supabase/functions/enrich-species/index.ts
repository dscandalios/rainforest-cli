// enrich-species — standalone endpoint to (re-)enrich a species by name.
// Useful for admin tools or backfilling.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude } from '../_shared/anthropic.ts';
import { rawPowerScore, tierForScore } from '../_shared/stats.ts';

const enrichTool = {
  name: 'species_profile',
  description: 'Structured biology data for a spider species used to compute card stats.',
  input_schema: {
    type: 'object',
    properties: {
      venom_score_0_100: { type: 'number' },
      size_score_0_100: { type: 'number' },
      ability_uniqueness_0_100: { type: 'number' },
      speed_score_0_100: { type: 'number' },
      aggression_score_0_100: { type: 'number' },
      hunting_style: { type: 'string' },
      ability_name: { type: 'string' },
      ability_text: { type: 'string' },
      ability2_name: { type: 'string' },
      ability2_text: { type: 'string' },
      medically_significant: { type: 'boolean' },
      safety_note: { type: 'string' },
      range_notes: { type: 'string' },
    },
    required: [
      'venom_score_0_100',
      'size_score_0_100',
      'ability_uniqueness_0_100',
      'speed_score_0_100',
      'aggression_score_0_100',
      'hunting_style',
      'ability_name',
      'ability_text',
      'medically_significant',
    ],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST')
    return new Response('method not allowed', { status: 405 });

  const { scientific_name, common_name } = (await req.json()) as {
    scientific_name: string;
    common_name?: string;
  };
  if (!scientific_name) {
    return new Response('scientific_name required', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return new Response('missing anthropic key', { status: 500 });

  const block = await callClaude({
    apiKey,
    system:
      'You are a spider biologist. Provide structured, factually accurate data for a card game. ' +
      'Do not fabricate. If unsure, pick conservative middle values.',
    messages: [
      {
        role: 'user',
        content: `Species: ${common_name ?? ''} (${scientific_name}). Return the species_profile tool.`,
      },
    ],
    tools: [enrichTool],
    toolChoice: { type: 'tool', name: 'species_profile' },
    maxTokens: 700,
  });
  const e = block.input as Record<string, any>;

  const raw = rawPowerScore({
    venom_score: e.venom_score_0_100,
    size_score: e.size_score_0_100,
    ability_uniqueness: e.ability_uniqueness_0_100,
    speed_score: e.speed_score_0_100,
    aggression_score: e.aggression_score_0_100,
  });

  const { data, error } = await supabase
    .from('species')
    .upsert(
      {
        common_name: common_name ?? scientific_name,
        scientific_name,
        venom_score: e.venom_score_0_100,
        size_score: e.size_score_0_100,
        ability_uniqueness: e.ability_uniqueness_0_100,
        speed_score: e.speed_score_0_100,
        aggression_score: e.aggression_score_0_100,
        raw_power_score: raw,
        calibrated_score: raw,
        tier: tierForScore(raw),
        ability_name: e.ability_name,
        ability_text: e.ability_text,
        ability2_name: e.ability2_name ?? null,
        ability2_text: e.ability2_text ?? null,
        medically_significant: !!e.medically_significant,
        safety_note: e.safety_note ?? null,
        raw_traits: {
          hunting_style: e.hunting_style,
          range_notes: e.range_notes ?? null,
        },
        enriched_at: new Date().toISOString(),
      },
      { onConflict: 'scientific_name' },
    )
    .select('*')
    .single();

  if (error) {
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true, species: data }), {
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});
