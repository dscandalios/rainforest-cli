export type Tier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  tier: Tier;
  ability_name: string;
  ability_text: string;
  ability2_name: string | null;
  ability2_text: string | null;
  flavor_text: string;
  medically_significant: boolean;
  safety_note: string | null;
  hunting_style?: string | null;
}

export interface Capture {
  id: string;
  user_id: string;
  species_id: string | null;
  photo_path: string;
  thumbnail_path: string | null;
  lat_coarse: number | null;
  lng_coarse: number | null;
  city: string | null;
  captured_at: string;
  condition_modifier: number;
  hp: number;
  damage: number;
  tier: Tier;
  final_score: number;
  confidence: number;
  is_personal_best: boolean;
  species?: Species;
}

export interface ScanResponseOk {
  ok: true;
  rejected?: { reason: string };
  capture?: {
    id: string;
    species: Species;
    hp: number;
    damage: number;
    final_score: number;
    confidence: number;
    photo_path: string;
  };
}

export interface ScanResponseErr {
  ok: false;
  error: string;
}

export type ScanResponse = ScanResponseOk | ScanResponseErr;

export interface QueuedCapture {
  localId: string;
  localPhotoUri: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  capturedAt: string;
}
