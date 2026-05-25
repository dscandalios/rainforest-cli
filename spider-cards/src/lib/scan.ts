// Client-side scan flow. Replaces the supabase/functions/scan-spider Edge
// Function for the dev preview. Same shape of input + output.

import { callClaudeTool } from './anthropic';
import { supabase } from './supabase';
import type { ScanResponse } from '../types';

const scanTool = {
  name: 'spider_scan_result',
  description: 'Return the structured result of identifying a spider in a photograph.',
  input_schema: {
    type: 'object',
    properties: {
      is_spider: { type: 'boolean' },
      species_common_name: { type: 'string' },
      species_scientific_name: { type: 'string' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      photo_quality_0_1: { type: 'number', minimum: 0, maximum: 1 },
      flavor_text: { type: 'string' },
    },
    required: [
      'is_spider',
      'species_common_name',
      'species_scientific_name',
      'confidence',
      'photo_quality_0_1',
      'flavor_text',
    ],
  },
};

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

interface ScanInput {
  photo_quality_0_1: number;
  is_spider: boolean;
  species_common_name: string;
  species_scientific_name: string;
  confidence: number;
  flavor_text: string;
}

interface EnrichInput {
  venom_score_0_100: number;
  size_score_0_100: number;
  ability_uniqueness_0_100: number;
  speed_score_0_100: number;
  aggression_score_0_100: number;
  hunting_style: string;
  ability_name: string;
  ability_text: string;
  ability2_name?: string;
  ability2_text?: string;
  medically_significant: boolean;
  safety_note?: string;
  range_notes?: string;
}

function rawPowerScore(e: EnrichInput): number {
  return (
    0.3 * e.venom_score_0_100 +
    0.25 * e.size_score_0_100 +
    0.2 * e.ability_uniqueness_0_100 +
    0.15 * e.speed_score_0_100 +
    0.1 * e.aggression_score_0_100
  );
}

function tierForScore(score: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'epic';
  if (score >= 60) return 'rare';
  if (score >= 40) return 'uncommon';
  return 'common';
}

export async function scanSpiderClient(opts: {
  photoBase64: string;
  photoPath: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
}): Promise<ScanResponse> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { ok: false, error: 'not signed in' };

    // 1. Identify the spider.
    const scan = await callClaudeTool<ScanInput>({
      system:
        'You are a spider identification assistant for a citizen-science trading ' +
        'card game. Identify the spider if one is present. Be conservative: if you ' +
        'are unsure between species, pick the most likely and lower confidence. ' +
        'Never invent a species. If the photo does not show a spider, set ' +
        'is_spider=false and stop.',
      userText: 'Identify the spider in this photo and return the spider_scan_result tool.',
      imageBase64: opts.photoBase64,
      tools: [scanTool],
      toolChoice: { type: 'tool', name: 'spider_scan_result' },
      maxTokens: 800,
    });

    if (!scan.is_spider || scan.confidence < 0.4) {
      return {
        ok: true,
        rejected: {
          reason: !scan.is_spider
            ? 'No spider detected in photo.'
            : 'Low confidence ID — try a closer, better-lit shot.',
        },
      };
    }

    // 2. Look up species, enrich if missing.
    const sciName = scan.species_scientific_name.trim();
    let { data: species } = await supabase
      .from('species')
      .select('*')
      .ilike('scientific_name', sciName)
      .maybeSingle();

    if (!species) {
      const e = await callClaudeTool<EnrichInput>({
        system:
          'You are a spider biologist. Provide structured, factually accurate data ' +
          'for a trading card game. Do not fabricate. If unsure, pick conservative ' +
          "middle values. Card ability text should be fun but rooted in the species' " +
          'real biology.',
        userText: `Species: ${scan.species_common_name} (${sciName}). Return the species_profile tool.`,
        tools: [enrichTool],
        toolChoice: { type: 'tool', name: 'species_profile' },
        maxTokens: 700,
      });
      const raw = rawPowerScore(e);
      const tier = tierForScore(raw);

      const { data: inserted, error: insertErr } = await supabase
        .from('species')
        .insert({
          common_name: scan.species_common_name,
          scientific_name: sciName,
          venom_score: e.venom_score_0_100,
          size_score: e.size_score_0_100,
          ability_uniqueness: e.ability_uniqueness_0_100,
          speed_score: e.speed_score_0_100,
          aggression_score: e.aggression_score_0_100,
          raw_power_score: raw,
          calibrated_score: raw,
          tier,
          ability_name: e.ability_name,
          ability_text: e.ability_text,
          ability2_name: e.ability2_name ?? null,
          ability2_text: e.ability2_text ?? null,
          flavor_text: scan.flavor_text,
          medically_significant: !!e.medically_significant,
          safety_note: e.safety_note ?? null,
          raw_traits: {
            hunting_style: e.hunting_style,
            range_notes: e.range_notes ?? null,
          },
          enriched_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (insertErr || !inserted) {
        return { ok: false, error: `species insert failed: ${insertErr?.message}` };
      }
      species = inserted;
    }

    // 3. Compute capture stats from species' calibrated score and photo quality.
    const condition = Number(
      (0.97 + Math.max(0, Math.min(1, scan.photo_quality_0_1)) * 0.06).toFixed(3),
    );
    const score = (species.calibrated_score ?? species.raw_power_score ?? 30) as number;
    const hp = Math.round((50 + score * 2.5) * condition);
    const damage = Math.round((10 + score * 1.1) * condition);

    // 4. Insert capture.
    const { data: capture, error: capErr } = await supabase
      .from('captures')
      .insert({
        user_id: user.id,
        species_id: species.id,
        photo_path: opts.photoPath,
        lat_coarse: roundCoarse(opts.lat),
        lng_coarse: roundCoarse(opts.lng),
        city: opts.city,
        condition_modifier: condition,
        hp,
        damage,
        tier: species.tier ?? tierForScore(score),
        final_score: Number(score.toFixed(2)),
        confidence: scan.confidence,
      })
      .select('*')
      .single();
    if (capErr || !capture) {
      return { ok: false, error: `capture insert failed: ${capErr?.message}` };
    }

    return {
      ok: true,
      capture: {
        id: capture.id,
        photo_path: capture.photo_path,
        hp: capture.hp,
        damage: capture.damage,
        final_score: capture.final_score,
        confidence: capture.confidence,
        species: {
          id: species.id,
          common_name: species.common_name,
          scientific_name: species.scientific_name,
          tier: capture.tier,
          ability_name: species.ability_name ?? '—',
          ability_text: species.ability_text ?? '',
          ability2_name: species.ability2_name,
          ability2_text: species.ability2_text,
          flavor_text: species.flavor_text ?? scan.flavor_text,
          medically_significant: !!species.medically_significant,
          safety_note: species.safety_note,
        },
      },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function roundCoarse(v: number | null): number | null {
  if (v === null || v === undefined) return null;
  return Number(v.toFixed(3));
}
