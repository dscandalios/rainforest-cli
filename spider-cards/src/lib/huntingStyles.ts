// Hunting-style → type pip metadata. Used by the card art to show a small
// "energy type" badge themed to the spider's real hunting strategy.

export type HuntingStyle =
  | 'ambush'
  | 'cursorial'
  | 'orb_web'
  | 'sheet_web'
  | 'cobweb'
  | 'spit'
  | 'bolas'
  | 'diving'
  | 'jumping'
  | 'trapdoor'
  | 'araneophagic'
  | 'hackled_web'
  | 'burrow_ambush';

interface HuntingMeta {
  abbr: string;
  label: string;
  glyph: string; // single-char Unicode symbol used as the pip icon
  color: string; // pip background
  fg: string; // pip foreground
}

const meta: Record<HuntingStyle, HuntingMeta> = {
  ambush:        { abbr: 'AMB', label: 'Ambush',       glyph: '◈', color: '#5c2b2b', fg: '#ffd1d1' },
  cursorial:     { abbr: 'RUN', label: 'Cursorial',    glyph: '➤', color: '#3a4a2a', fg: '#dff5b8' },
  orb_web:       { abbr: 'ORB', label: 'Orb-Weaver',   glyph: '✺', color: '#2b3a5c', fg: '#bfd3ff' },
  sheet_web:     { abbr: 'SHT', label: 'Sheet Web',    glyph: '▦', color: '#2b4a4a', fg: '#bfeded' },
  cobweb:        { abbr: 'COB', label: 'Cobweb',       glyph: '✷', color: '#3a2b4a', fg: '#dbc0ff' },
  spit:          { abbr: 'SPT', label: 'Spitting',     glyph: '✻', color: '#5c4a2b', fg: '#ffe9b0' },
  bolas:         { abbr: 'BLS', label: 'Bolas',        glyph: '⬤', color: '#4a2b5c', fg: '#e7c0ff' },
  diving:        { abbr: 'DIV', label: 'Diving Bell',  glyph: '◐', color: '#1f4a5c', fg: '#bfeaff' },
  jumping:       { abbr: 'JMP', label: 'Jumping',      glyph: '⚡', color: '#5c5c1f', fg: '#fff7a0' },
  trapdoor:      { abbr: 'TRP', label: 'Trapdoor',     glyph: '◧', color: '#3a3a2a', fg: '#e6ddc7' },
  araneophagic:  { abbr: 'PRD', label: 'Spider-eater', glyph: '✶', color: '#5c1f2b', fg: '#ffc8d4' },
  hackled_web:   { abbr: 'HKL', label: 'Hackled Web',  glyph: '✦', color: '#2a5c3f', fg: '#c8ffd9' },
  burrow_ambush: { abbr: 'BUR', label: 'Burrower',     glyph: '⬇', color: '#3a2a1f', fg: '#ffd9b0' },
};

const fallback: HuntingMeta = {
  abbr: 'SPD',
  label: 'Spider',
  glyph: '✦',
  color: '#3a3a4a',
  fg: '#d8d8ee',
};

export function huntingMeta(style: string | null | undefined): HuntingMeta {
  if (!style) return fallback;
  return meta[style as HuntingStyle] ?? fallback;
}
