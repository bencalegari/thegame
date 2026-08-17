import type { League, LocalityBand } from './types';

export const PLATEAU_MI = 35;
export const HALF_MI = 50;
export const RELEVANT_TEAM_MI = 400;

export function localityFactor(miles: number): number {
  if (!Number.isFinite(miles)) return 0;
  if (miles <= PLATEAU_MI) return 1;
  const x = (miles - PLATEAU_MI) / HALF_MI;
  return 1 / (1 + x * x);
}

export function localityBand(miles: number): LocalityBand {
  if (!Number.isFinite(miles)) return 'nearest_available';
  if (miles <= PLATEAU_MI) return 'home';
  if (miles <= 150) return 'regional';
  if (miles <= 300) return 'distant';
  return 'nearest_available';
}

export const LEAGUE_WEIGHT: Record<League, { regular: number; post: number }> = {
  nfl: { regular: 1.0, post: 1.0 },
  mlb: { regular: 0.75, post: 0.85 },
  nba: { regular: 0.75, post: 0.85 },
  cfb: { regular: 0.7, post: 0.85 },
  nhl: { regular: 0.65, post: 0.8 },
  cbb: { regular: 0.4, post: 0.8 },
};

export function recencyFactor(ageHours: number): number {
  if (ageHours <= 24) return 1.6;
  if (ageHours <= 48) return 1.3;
  if (ageHours <= 72) return 1.0;
  if (ageHours <= 120) return 0.6;
  return 0.35;
}

export function prominenceFactor(bestRank: number | null, championshipLevel: string | null): number {
  const conference = championshipLevel === 'conference' ? 1.15 : 1;
  if (bestRank === null) return conference;
  if (bestRank <= 10) return 1.4 * conference;
  if (bestRank <= 25) return 1.25 * conference;
  return conference;
}
