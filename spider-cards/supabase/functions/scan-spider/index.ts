// scan-spider — POST { photo_path, lat?, lng? }
// 1. Fetch the photo from Storage as base64.
// 2. Ask Claude to identify the spider (tool use → structured JSON).
// 3. Look up or create the species (calls enrich-species inline if new).
// 4. Compute per-capture HP/Damage from the species' calibrated_score.
// 5. Insert into captures, return the card payload.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, CLAUDE_MODEL } from '../_shared/anthropic.ts';
import {
  conditionModifier,
  damageForScore,
  hpForScore,
  rawPowerScore,
  tierForScore,
} from '../_shared/stats.ts';

interface ScanRequest {
  photo_path: string;
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
}

interface ScanResponse {
  ok: boolean;
  rejected?: { reason: string };
  capture?: {
    id: string;
    species: {
      id: string;
      common_name: string;
      scientific_name: string;
      tier: string;
      ability_name: string;
      ability_text: string;
      ability2_name: string | null;
      ability2_text: string | null;
      flavor_text: string;
      medically_significant: boolean;
      safety_note: string | null;
    };
    hp: number;
    damage: number;
    final_score: number;
    confidence: number;
    photo_path: string;
  };
}

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
      visible_traits: {
        type: 'object',
        properties: {
          body_size_estimate_mm: { type: 'number' },
          coloration: { type: 'string' },
          web_visible: { type: 'boolean' },
          posture: { type: 'string' },
          habitat_visible: { type: 'string' },
        },
        required: ['coloration'],
      },
      photo_quality_0_1: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description:
          'Subjective quality of the photo for ID purposes: 1 = sharp, well-lit, full body; 0 = unusable.',
      },
      flavor_text: {
        type: 'string',
        description:
          '1-2 sentence flavor text in a naturalist voice, evocative not cute. No emoji.',
      },
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
      venom_score_0_100: {
        type: 'number',
        description: 'Threat to humans, not absolute toxicity. 95 = widow, 10 = orbweaver.',
      },
      size_score_0_100: {
        type: 'number',
        description: 'Based on leg span. Cellar spider ~40, tarantula ~95.',
      },
      ability_uniqueness_0_100: {
        type: 'number',
        description:
          "How unusual / fun the species' real biology is for a card ability.",
      },
      speed_score_0_100: { type: 'number' },
      aggression_score_0_100: { type: 'number' },
      hunting_style: {
        type: 'string',
        enum: [
          'ambush',
          'cursorial',
          'orb_web',
          'sheet_web',
          'cobweb',
          'spit',
          'bolas',
          'diving',
          'jumping',
          'trapdoor',
          'araneophagic',
          'hackled_web',
          'burrow_ambush',
        ],
      },
      ability_name: { type: 'string' },
      ability_text: {
        type: 'string',
        description: 'Pokémon-style card ability text, themed to real biology.',
      },
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ ok: false, error: 'missing bearer token' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const userRes = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userRes.error || !userRes.data.user) {
      return json({ ok: false, error: 'invalid auth' }, 401);
    }
    const userId = userRes.data.user.id;

    const body = (await req.json()) as ScanRequest;
    if (!body.photo_path) {
      return json({ ok: false, error: 'photo_path required' }, 400);
    }

    // Fetch the photo from Storage as bytes, then base64-encode.
    const download = await supabase.storage
      .from('spider-photos')
      .download(body.photo_path);
    if (download.error || !download.data) {
      return json({ ok: false, error: 'photo not found' }, 404);
    }
    const photoBytes = new Uint8Array(await download.data.arrayBuffer());
    const photoB64 = base64FromBytes(photoBytes);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ ok: false, error: 'missing anthropic key' }, 500);

    // 1. Identify.
    const scanBlock = await callClaude({
      apiKey,
      system:
        'You are a spider identification assistant for a citizen-science trading card game. ' +
        'Identify the spider if one is present. Be conservative: if you are unsure between species, ' +
        'pick the most likely and lower confidence. Never invent a species. If the photo does not ' +
        'show a spider, set is_spider=false and stop.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: photoB64,
              },
            },
            {
              type: 'text',
              text: 'Identify the spider in this photo and return the spider_scan_result tool.',
            },
          ],
        },
      ],
      tools: [scanTool],
      toolChoice: { type: 'tool', name: 'spider_scan_result' },
      maxTokens: 800,
    });
    const scan = scanBlock.input as {
      is_spider: boolean;
      species_common_name: string;
      species_scientific_name: string;
      confidence: number;
      photo_quality_0_1: number;
      flavor_text: string;
    };

    if (!scan.is_spider || scan.confidence < 0.4) {
      return json<ScanResponse>({
        ok: true,
        rejected: {
          reason: !scan.is_spider
            ? 'No spider detected in photo.'
            : 'Low confidence ID — try a closer, better-lit shot.',
        },
      });
    }

    // 2. Look up or enrich species.
    const sciName = scan.species_scientific_name.trim();
    let { data: species } = await supabase
      .from('species')
      .select('*')
      .ilike('scientific_name', sciName)
      .maybeSingle();

    if (!species) {
      // Enrich inline. (For background-fill behavior, you could move this to a queue.)
      const enrichBlock = await callClaude({
        apiKey,
        system:
          'You are a spider biologist. Provide structured, factually accurate data for the ' +
          'requested species, suitable for a trading card game. Do not fabricate. If unsure, ' +
          'pick conservative middle values. Card ability text should be fun but rooted in the ' +
          "species' real biology.",
        messages: [
          {
            role: 'user',
            content: `Species: ${scan.species_common_name} (${sciName}). Return the species_profile tool.`,
          },
        ],
        tools: [enrichTool],
        toolChoice: { type: 'tool', name: 'species_profile' },
        maxTokens: 700,
      });
      const e = enrichBlock.input as Record<string, any>;

      const raw = rawPowerScore({
        venom_score: e.venom_score_0_100,
        size_score: e.size_score_0_100,
        ability_uniqueness: e.ability_uniqueness_0_100,
        speed_score: e.speed_score_0_100,
        aggression_score: e.aggression_score_0_100,
      });

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
          calibrated_score: raw, // will be recalibrated nightly
          tier: tierForScore(raw),
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
        return json({ ok: false, error: `species insert failed: ${insertErr?.message}` }, 500);
      }
      species = inserted;
    }

    // 3. Compute capture stats.
    const condition = conditionModifier(scan.photo_quality_0_1);
    const score = species.calibrated_score ?? species.raw_power_score ?? 30;
    const hp = hpForScore(score, condition);
    const damage = damageForScore(score, condition);

    // 4. Insert capture.
    const { data: capture, error: capErr } = await supabase
      .from('captures')
      .insert({
        user_id: userId,
        species_id: species.id,
        photo_path: body.photo_path,
        lat_coarse: roundCoarse(body.lat ?? null),
        lng_coarse: roundCoarse(body.lng ?? null),
        city: body.city ?? null,
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
      return json({ ok: false, error: `capture insert failed: ${capErr?.message}` }, 500);
    }

    return json<ScanResponse>({
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
    });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String(err) }, 500);
  }
});

function json<T>(body: T, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function roundCoarse(v: number | null): number | null {
  if (v === null || v === undefined) return null;
  // ~100m precision: 3 decimals at latitude ≈ 111m.
  return Number(v.toFixed(3));
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
