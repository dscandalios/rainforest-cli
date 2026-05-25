-- Seed 25 common Pacific Northwest spiders.
-- Calibrated stats will be filled in by the first run of `recalibrate-curve`;
-- raw component scores are biology-based and roughly normalized 0-100.
-- venom_score is *threat to humans*; size_score is leg-span based.

insert into public.species
  (common_name, scientific_name, raw_traits, venom_score, size_score, ability_uniqueness, speed_score, aggression_score,
   ability_name, ability_text, ability2_name, ability2_text, flavor_text,
   medically_significant, safety_note)
values
  ('Cross Orbweaver', 'Araneus diadematus',
   '{"hunting_style":"orb_web","web_complexity":85,"body_size_mm":13,"leg_span_mm":30,"range":"PNW common"}'::jsonb,
   10, 35, 55, 30, 20,
   'Web Tax', 'Opponent loses 5 HP at the end of each turn they remain in your web.', null, null,
   'A patient architect — rebuilds her wheel-shaped web every night before the dew settles.',
   false, null),

  ('Giant House Spider', 'Eratigena duellica',
   '{"hunting_style":"sheet_web","web_complexity":40,"body_size_mm":18,"leg_span_mm":75,"range":"PNW common"}'::jsonb,
   15, 75, 45, 80, 25,
   'Sprint', 'On your first turn, attack twice.', null, null,
   'The basement champion. Few spiders move faster across a kitchen floor.',
   false, null),

  ('Bold Jumper', 'Phidippus audax',
   '{"hunting_style":"cursorial","web_complexity":5,"body_size_mm":13,"leg_span_mm":20,"range":"PNW common","trait":"jumping"}'::jsonb,
   12, 30, 80, 90, 35,
   'Pounce', 'Strike first this turn. If you do, deal +20 damage.', 'Iridescent Stare', 'Reveal opponent''s top card.',
   'Velvet-black with metallic chelicerae — judges every leap before it commits.',
   false, null),

  ('Zebra Jumper', 'Salticus scenicus',
   '{"hunting_style":"cursorial","web_complexity":5,"body_size_mm":6,"leg_span_mm":10,"range":"PNW common","trait":"jumping"}'::jsonb,
   8, 12, 70, 92, 25,
   'Wall Walker', 'Cannot be targeted by web-based abilities.', null, null,
   'A pinstripe sprinter on south-facing walls — chases anything it can see.',
   false, null),

  ('Hobo Spider', 'Eratigena agrestis',
   '{"hunting_style":"sheet_web","web_complexity":50,"body_size_mm":14,"leg_span_mm":45,"range":"PNW abundant"}'::jsonb,
   30, 55, 40, 78, 40,
   'Funnel Retreat', 'Reduce incoming damage by 10 each turn.', null, null,
   'Lives at the mouth of a silken funnel — bolts out to ambush, then bolts back in.',
   true, 'Bites are uncommon and most are dry; seek care if you develop a slow-healing wound.'),

  ('Western Black Widow', 'Latrodectus hesperus',
   '{"hunting_style":"cobweb","web_complexity":65,"body_size_mm":13,"leg_span_mm":35,"range":"PNW dry sites"}'::jsonb,
   95, 50, 95, 35, 30,
   'Neurotoxin', 'At the end of each turn, opponent loses 15 HP for 3 turns.', 'Tangle Web', 'Opponent skips next attack on a coin flip.',
   'Glossy black with a crimson hourglass. The slow assassin of woodpiles and meter boxes.',
   true, 'Medically significant. Do not handle. Seek medical care if bitten.'),

  ('Western Spotted Orbweaver', 'Neoscona oaxacensis',
   '{"hunting_style":"orb_web","web_complexity":80,"body_size_mm":15,"leg_span_mm":35,"range":"PNW occasional"}'::jsonb,
   10, 45, 50, 35, 18,
   'Night Net', '+25 damage when played at night.', null, null,
   'A daily renovator — eats her own web at dawn and respins it by dusk.',
   false, null),

  ('Cellar Spider', 'Pholcus phalangioides',
   '{"hunting_style":"cobweb","web_complexity":55,"body_size_mm":9,"leg_span_mm":50,"range":"PNW abundant indoors"}'::jsonb,
   5, 40, 65, 25, 10,
   'Vibration', 'When attacked, blur — opponent misses on a coin flip.', null, null,
   'Long-legged ghost of corners and ceilings. Eats other spiders, including larger ones.',
   false, null),

  ('Western Black Jumping Spider', 'Phidippus johnsoni',
   '{"hunting_style":"cursorial","web_complexity":5,"body_size_mm":15,"leg_span_mm":22,"range":"PNW common","trait":"jumping"}'::jsonb,
   15, 35, 78, 88, 40,
   'Crimson Pounce', 'First strike. If your card is Rare or higher, +25 damage.', null, null,
   'Red abdomen, black velvet body — leaps with a silk safety line trailing behind.',
   false, null),

  ('Yellow Sac Spider', 'Cheiracanthium mildei',
   '{"hunting_style":"cursorial","web_complexity":15,"body_size_mm":9,"leg_span_mm":25,"range":"PNW indoors"}'::jsonb,
   35, 25, 50, 70, 50,
   'Night Stalk', '+15 damage during the opponent''s first turn.', null, null,
   'Pale wanderer that hunts on walls after lights-out. Quick to bite when pressed.',
   false, null),

  ('Wolf Spider (Hogna)', 'Hogna carolinensis',
   '{"hunting_style":"cursorial","web_complexity":0,"body_size_mm":25,"leg_span_mm":55,"range":"PNW dry edges"}'::jsonb,
   18, 70, 60, 85, 55,
   'Mother''s Burden', 'Gain +20 HP if no other card is in play.', null, null,
   'Carries her egg sac on her spinnerets and her spiderlings on her back. Hunts by run-down.',
   false, null),

  ('Pirate Spider', 'Mimetus puritanus',
   '{"hunting_style":"araneophagic","web_complexity":10,"body_size_mm":5,"leg_span_mm":12,"range":"PNW rare"}'::jsonb,
   20, 15, 92, 40, 50,
   'Web Pirate', 'Take control of one opponent ability with the word "Web" in it.', null, null,
   'Lures other spiders by plucking their webs like a deceitful guitar — then strikes.',
   false, null),

  ('Long-jawed Orbweaver', 'Tetragnatha laboriosa',
   '{"hunting_style":"orb_web","web_complexity":75,"body_size_mm":8,"leg_span_mm":25,"range":"PNW streamsides"}'::jsonb,
   8, 22, 50, 45, 15,
   'Riparian Web', '+15 damage in water-themed arenas.', null, null,
   'Stretches thin along reeds, jaws longer than her body, web spanning the current.',
   false, null),

  ('Goldenrod Crab Spider', 'Misumena vatia',
   '{"hunting_style":"ambush","web_complexity":0,"body_size_mm":10,"leg_span_mm":18,"range":"PNW meadows"}'::jsonb,
   12, 22, 75, 25, 30,
   'Color Shift', 'Become immune to one ability type per match (choose at play).', null, null,
   'Shifts between yellow and white over days to match her flower. Ambushes bees mid-sip.',
   false, null),

  ('Triangulate Cobweb Spider', 'Steatoda triangulosa',
   '{"hunting_style":"cobweb","web_complexity":55,"body_size_mm":6,"leg_span_mm":15,"range":"PNW indoors"}'::jsonb,
   25, 18, 55, 35, 25,
   'Sticky Tangle', 'Opponent attack damage reduced by 5 each turn while in your web.', null, null,
   'Triangle-marked cousin of the widow. Lives quietly behind the washing machine.',
   false, null),

  ('False Black Widow', 'Steatoda grossa',
   '{"hunting_style":"cobweb","web_complexity":60,"body_size_mm":10,"leg_span_mm":28,"range":"PNW indoors"}'::jsonb,
   35, 32, 60, 35, 28,
   'Widow Mimicry', 'First-strike. Opponents treat your tier as +1 for choosing targets.', null, null,
   'Plump and round, often mistaken for a widow — a true widow''s natural predator.',
   false, null),

  ('Mouse Spider (Scotophaeus)', 'Scotophaeus blackwalli',
   '{"hunting_style":"cursorial","web_complexity":5,"body_size_mm":12,"leg_span_mm":30,"range":"PNW indoors"}'::jsonb,
   18, 32, 50, 72, 35,
   'Silent Sprint', 'Cannot be the target of "first strike" abilities.', null, null,
   'A velvet-grey runner with no interest in webs — only walls, only at night.',
   false, null),

  ('Dictyna Spider', 'Dictyna sublata',
   '{"hunting_style":"hackled_web","web_complexity":70,"body_size_mm":3,"leg_span_mm":7,"range":"PNW grass tips"}'::jsonb,
   5, 5, 45, 30, 10,
   'Hackled Snare', 'Opponent''s next attack costs them 5 HP.', null, null,
   'Tiny weaver of fluffy snares on dried plant tips. Easy to miss; hard to escape.',
   false, null),

  ('Banded Garden Spider', 'Argiope trifasciata',
   '{"hunting_style":"orb_web","web_complexity":92,"body_size_mm":18,"leg_span_mm":45,"range":"PNW gardens"}'::jsonb,
   12, 55, 70, 38, 20,
   'Stabilimentum', 'Reveal and disarm one opponent ability per match.', null, null,
   'Writes a zigzag silk signature down the center of her web. Bold, banded, unmistakable.',
   false, null),

  ('Cat-faced Spider', 'Araneus gemmoides',
   '{"hunting_style":"orb_web","web_complexity":82,"body_size_mm":18,"leg_span_mm":38,"range":"PNW eaves"}'::jsonb,
   10, 50, 65, 35, 20,
   'Porch Light', '+20 damage if a Moth, Beetle, or Mosquito card is in play.', null, null,
   'Two cat-ear bumps on her back. Builds enormous orbs across porch lights every autumn.',
   false, null),

  ('Folding-door Spider', 'Antrodiaetus pacificus',
   '{"hunting_style":"trapdoor","web_complexity":30,"body_size_mm":18,"leg_span_mm":40,"range":"PNW forest duff"}'::jsonb,
   20, 50, 88, 40, 35,
   'Ambush', 'If this is the first card you play, double its damage.', null, null,
   'Lives behind a hinged silken door in moss banks. Strikes once, drags down, vanishes.',
   false, null),

  ('Western Parson Spider', 'Herpyllus propinquus',
   '{"hunting_style":"cursorial","web_complexity":5,"body_size_mm":13,"leg_span_mm":32,"range":"PNW indoors"}'::jsonb,
   25, 35, 58, 75, 45,
   'Cravat Strike', 'First strike. +10 damage versus jumping spiders.', null, null,
   'A dark hunter with a white cravat down its back. Bites readily if trapped against skin.',
   false, null),

  ('Spitting Spider', 'Scytodes thoracica',
   '{"hunting_style":"spit","web_complexity":0,"body_size_mm":6,"leg_span_mm":15,"range":"PNW indoors"}'::jsonb,
   10, 15, 95, 30, 18,
   'Glue Spit', 'Opponent skips their next attack.', 'Slow Stalker', 'Cannot be targeted on the first turn.',
   'Spits a zigzag of venom-laced glue from 20 mm away — pins prey to the wall in one shot.',
   false, null),

  ('Pacific Folding-door (Female)', 'Antrodiaetus unicolor',
   '{"hunting_style":"trapdoor","web_complexity":30,"body_size_mm":22,"leg_span_mm":48,"range":"PNW forest"}'::jsonb,
   22, 60, 85, 38, 40,
   'Sealed Burrow', 'Take 0 damage on the first turn. Lose this ability if you attack.', null, null,
   'A long-lived burrow keeper — some individuals seal the same door for over a decade.',
   false, null),

  ('Western Tarantula (visiting)', 'Aphonopelma iodius',
   '{"hunting_style":"burrow_ambush","web_complexity":15,"body_size_mm":50,"leg_span_mm":120,"range":"PNW edges of range, rare"}'::jsonb,
   25, 95, 80, 45, 30,
   'Urticating Bristles', 'Reflect 15 damage back at any attacker.', 'Burrow Anchor', '+30 HP while no other card is in play.',
   'A high-desert wanderer that occasionally crosses into southern Oregon. Stoic, slow, sturdy.',
   false, null);

-- After insertion, raw_power_score will be computed by the recalibrate function.
-- Pre-fill a reasonable raw_power_score so day-one captures work before the first nightly run.
update public.species
set raw_power_score = round((
  0.30 * coalesce(venom_score, 10) +
  0.25 * coalesce(size_score, 30) +
  0.20 * coalesce(ability_uniqueness, 50) +
  0.15 * coalesce(speed_score, 40) +
  0.10 * coalesce(aggression_score, 30)
)::numeric, 2),
calibrated_score = round((
  0.30 * coalesce(venom_score, 10) +
  0.25 * coalesce(size_score, 30) +
  0.20 * coalesce(ability_uniqueness, 50) +
  0.15 * coalesce(speed_score, 40) +
  0.10 * coalesce(aggression_score, 30)
)::numeric, 2),
tier = case
  when (
    0.30 * coalesce(venom_score, 10) +
    0.25 * coalesce(size_score, 30) +
    0.20 * coalesce(ability_uniqueness, 50) +
    0.15 * coalesce(speed_score, 40) +
    0.10 * coalesce(aggression_score, 30)
  ) >= 90 then 'legendary'
  when (
    0.30 * coalesce(venom_score, 10) +
    0.25 * coalesce(size_score, 30) +
    0.20 * coalesce(ability_uniqueness, 50) +
    0.15 * coalesce(speed_score, 40) +
    0.10 * coalesce(aggression_score, 30)
  ) >= 75 then 'epic'
  when (
    0.30 * coalesce(venom_score, 10) +
    0.25 * coalesce(size_score, 30) +
    0.20 * coalesce(ability_uniqueness, 50) +
    0.15 * coalesce(speed_score, 40) +
    0.10 * coalesce(aggression_score, 30)
  ) >= 60 then 'rare'
  when (
    0.30 * coalesce(venom_score, 10) +
    0.25 * coalesce(size_score, 30) +
    0.20 * coalesce(ability_uniqueness, 50) +
    0.15 * coalesce(speed_score, 40) +
    0.10 * coalesce(aggression_score, 30)
  ) >= 40 then 'uncommon'
  else 'common'
end,
enriched_at = now();
