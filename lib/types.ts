export type League = 'nfl' | 'nba' | 'mlb' | 'nhl';
export type Sport = 'football' | 'basketball' | 'baseball' | 'hockey';
export type GameStatus = 'scheduled' | 'in_progress' | 'final';

export interface TeamEntry {
  espnId: string;
  league: League;
  sport: Sport;
  name: string;
  abbreviation: string;
}

export interface CityMapping {
  canonicalName: string;
  aliases: string[];
  teams: TeamEntry[];
}

export interface NormalizedGame {
  id: string;
  sport: Sport;
  league: League;
  date: Date;
  status: GameStatus;
  seasonType: 1 | 2 | 3;
  isChampionship: boolean;
  seriesSummary: string | null;
  headline: string | null;
  homeTeam: { id: string; name: string; abbreviation: string; score: number };
  awayTeam: { id: string; name: string; abbreviation: string; score: number };
  winner: 'home' | 'away' | 'tied' | null;
}

export interface GameResult {
  game: NormalizedGame;
  reason: string;
  score: number;
}

export type TierId = 'championship' | 'localPlayoffs' | 'localRegular';

export interface TierConfig {
  id: TierId;
  label: string;
  description: string;
}

export const DEFAULT_TIER_ORDER: TierConfig[] = [
  { id: 'championship', label: 'Championship Game', description: 'Super Bowl, NBA Finals, World Series, Stanley Cup' },
  { id: 'localPlayoffs', label: 'Local Team — Playoffs', description: "Your city's team in the postseason" },
  { id: 'localRegular', label: 'Local Team — Regular Season', description: "Regular season game for your team" },
];

// Weights by rank position (index 0 = highest priority)
export const TIER_WEIGHTS = [1000, 500, 200] as const;

export type ApiResponse =
  | { success: true; result: GameResult; city: string }
  | { success: false; error: 'city_not_found' | 'no_recent_games' | 'api_error'; message: string };
