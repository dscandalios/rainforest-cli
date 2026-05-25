// Spider Cards — design tokens.
// Drives the whole app's look. Update values here, not in component styles.
//
// Mood: moody, dark, haunting, fantastical. Deep blacks and crypt navys for
// surfaces; tier colors are desaturated and elemental (moss / dusk / arcane /
// ember). Typography pairs a serif title face with disciplined small-caps
// labels. Foil shimmer + ember glow signal high-tier cards.

import type { Tier } from '../types';

export const palette = {
  voidBlack:   '#04040a',
  obsidian:    '#0a0a13',
  crypt:       '#11111c',
  ash:         '#1c1c28',
  fog:         '#3a3a4a',
  smoke:       '#5a5a6a',
  bone:        '#d6cfbd',
  parchment:   '#c0b69e',
  inkBlood:    '#5a161a',
  ember:       '#c97e1a',
  moss:        '#4a6b3a',
  arcane:      '#6b3a8a',
  aetherGold:  '#d4a93b',
  aetherSilver:'#a8a3b8',
  danger:      '#a3413f',
} as const;

export interface TierTheme {
  primary: string;   // dominant frame color
  accent: string;    // lighter highlight
  deep: string;      // shadow / inner frame
  glow: string;      // outer shadow color
  textOnFrame: string;
  label: string;
}

export const tierTheme: Record<Tier, TierTheme> = {
  common: {
    primary: '#7a7480',
    accent: '#a8a3b8',
    deep: '#1a1822',
    glow: '#2a2630',
    textOnFrame: '#dcd6c8',
    label: 'Common',
  },
  uncommon: {
    primary: '#4a6b3a',
    accent: '#88a070',
    deep: '#0f1c0a',
    glow: '#2a4020',
    textOnFrame: '#dfeac8',
    label: 'Uncommon',
  },
  rare: {
    primary: '#3a5a8a',
    accent: '#7090c8',
    deep: '#0a1426',
    glow: '#1f3a6e',
    textOnFrame: '#cfdfff',
    label: 'Rare',
  },
  epic: {
    primary: '#6b3a8a',
    accent: '#b070d0',
    deep: '#15082a',
    glow: '#3a1f5a',
    textOnFrame: '#e8d4ff',
    label: 'Epic',
  },
  legendary: {
    primary: '#c97e1a',
    accent: '#f0c460',
    deep: '#2a1505',
    glow: '#5a3a10',
    textOnFrame: '#ffe9b8',
    label: 'Legendary',
  },
};

export const font = {
  title: 'Georgia',
  serif: 'Georgia',
  body: 'System',
} as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 18, xxl: 24 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const motion = {
  fast: 180,
  base: 360,
  slow: 720,
  drama: 1200,
} as const;

// Card frame proportions
export const card = {
  outerRadius: 18,
  innerRadius: 8,
  framePadding: 5,
  borderThickness: 2,
} as const;
