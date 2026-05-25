import type { Tier } from '../types';

export const colors = {
  bg: '#0b0b12',
  bgElev: '#15151f',
  text: '#f3f3f7',
  textDim: '#9a9aaa',
  border: '#2a2a38',
  accent: '#b794f4',
  danger: '#ff5d5d',
};

export const tierColors: Record<Tier, { fg: string; bg: string; glow: string; label: string }> = {
  common: { fg: '#cfd2d8', bg: '#2a2a38', glow: '#5a5a6e', label: 'Common' },
  uncommon: { fg: '#a8e6a3', bg: '#1f3a26', glow: '#3fbd4b', label: 'Uncommon' },
  rare: { fg: '#8ec9ff', bg: '#1d2c4a', glow: '#4d8fe3', label: 'Rare' },
  epic: { fg: '#d6a8ff', bg: '#2e1f48', glow: '#8d4dd9', label: 'Epic' },
  legendary: { fg: '#ffd56b', bg: '#3a2a10', glow: '#f0b020', label: 'Legendary' },
};

export const tierOrder: Tier[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];
