# Spider Cards

Photograph real spiders. The app uses Claude vision to identify the species, generates a Pokémon-style trading card with HP, damage, and a real-biology ability, and adds it to your collection. Find the highest-ranked spider on the global leaderboard.

> Stats are deterministic per species (same spider → same card) but calibrated on a bell curve weighted by the active user base (Oregon-heavy), so common PNW spiders sit near the median and rare visitors land in the tails.

## Stack

- **App:** React Native + Expo (Expo Router, TypeScript, Reanimated, Zustand, React Query).
- **Backend:** Supabase — Postgres + Auth + Storage + Edge Functions (Deno).
- **AI:** Anthropic Claude (`claude-sonnet-4-6`) with vision + tool use.

## Layout

```
spider-cards/
├── app/                        Expo Router screens
│   ├── _layout.tsx             Root layout, auth gate, React Query provider
│   ├── (tabs)/                 Capture / Collection / Leaderboard / Profile
│   ├── card/[id].tsx           Card detail
│   ├── species/[id].tsx        Pokédex-style species page
│   └── sign-in.tsx             Email magic-link sign-in
├── src/
│   ├── components/             SpiderCard, CardReveal, FramingOverlay, TierBadge
│   ├── lib/                    supabase, api, stats, colors
│   ├── stores/captureQueue.ts  Offline capture queue (zustand + AsyncStorage)
│   └── types.ts
├── supabase/
│   ├── migrations/0001_init.sql        Schema, RLS, storage policies, triggers
│   ├── seed/species_pnw.sql            25 PNW spiders preloaded
│   └── functions/
│       ├── scan-spider/                Identify + generate card (Claude vision)
│       ├── enrich-species/             Admin/backfill enrichment
│       ├── recalibrate-curve/          Nightly bell-curve recalibration
│       └── _shared/                    Stats math + Anthropic client
└── app.json, package.json, tsconfig.json, babel.config.js
```

## Setup

### 1. Install JS dependencies

```bash
cd spider-cards
npm install
```

### 2. Create a Supabase project

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

Set the project env vars (Project → Settings → API):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only — never client)
- `ANTHROPIC_API_KEY` (Edge Functions only)

Copy `.env.example` → `.env` and fill in values.

### 3. Apply schema + seed

```bash
supabase db push                  # runs migrations/0001_init.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/species_pnw.sql
```

Or do everything locally with `supabase start && supabase db reset`.

### 4. Deploy Edge Functions

```bash
supabase functions deploy scan-spider
supabase functions deploy enrich-species
supabase functions deploy recalibrate-curve

supabase secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  RECALIBRATION_REGION=oregon
```

### 5. Schedule nightly recalibration

In the Supabase dashboard → **Database → Cron Jobs**, schedule:

```sql
select net.http_post(
  url:='https://<project>.functions.supabase.co/recalibrate-curve',
  headers:=jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_token'))
);
```

…to run `0 9 * * *` UTC (~2 AM PT).

### 6. Run the app

```bash
npm run start            # Expo dev server, scan with Expo Go on device
npm run ios              # iOS simulator
npm run android          # Android emulator
```

Production builds via EAS:

```bash
npm run build:ios
npm run build:android
```

## How the stat curve works

1. Every species has biology-based component scores 0–100: `venom_score`, `size_score`, `ability_uniqueness`, `speed_score`, `aggression_score`.
2. `raw_power_score` = weighted sum (0.30 / 0.25 / 0.20 / 0.15 / 0.10).
3. `recalibrate-curve` runs nightly, pulls observation counts per species for the active region (default `oregon`), and maps `raw_power_score` onto a target distribution where the **observation-weighted mean** lands at 50 with std-dev 15.
4. `calibrated_score` (1–100) drives card HP and damage:
   - `HP = round((50 + score * 2.5) * conditionMod)` → 50–300
   - `Damage = round((10 + score * 1.1) * conditionMod)` → 10–120
5. Per-capture variation is bounded to ±3% via `condition_modifier` (driven by Claude's photo-quality estimate).
6. Tier cutoffs: `<40` Common, `40–59` Uncommon, `60–74` Rare, `75–89` Epic, `≥90` Legendary.

This means a Hobo Spider (abundant in Oregon) sits near the middle of the curve here even though it would be a "rarer" species elsewhere — which is what the user-base calibration is for.

## Safety

- Cards for medically significant species (Black Widow, Hobo, Brown Recluse) include a red safety footer.
- The framing overlay never instructs users to "get closer" to dangerous species — only general framing tips.
- GPS is opt-in per capture and stored at ~3-decimal precision (~100m), only ever shown to other users at city level via the leaderboard view.

## Notes / next steps

- Battle mechanic is intentionally out of scope for v0.1; cards have HP/damage/abilities ready for a future PvP layer.
- Card export-as-image (`react-native-view-shot`) is wired into deps but not yet surfaced — drop a share button into `app/card/[id].tsx`.
- Offline queue (`src/stores/captureQueue.ts`) is in place; wiring `tryGetLocation()` failures and upload failures into it is a one-screen change.
