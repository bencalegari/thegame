export type League = 'nfl' | 'nba' | 'mlb' | 'nhl' | 'cfb' | 'cbb';
export type Sport = 'football' | 'basketball' | 'baseball' | 'hockey';
export type GameStatus = 'scheduled' | 'in_progress' | 'final';
export type ChampionshipLevel = 'national' | 'conference' | null;

export interface Place {
  id: string;
  name: string;
  state: string;
  country: 'US' | 'CA';
  lat: number;
  lng: number;
  population: number;
  label: string;
}

export interface PlaceSummary {
  id: string;
  label: string;
  name: string;
  state: string;
  population: number;
}

export interface TeamRecord {
  key: string;
  espnId: string;
  league: League;
  sport: Sport;
  name: string;
  shortName: string;
  abbreviation: string;
  lat: number;
  lng: number;
  venue: string;
  venueCity: string;
  venueState: string;
}

export interface GameTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  score: number;
  rank: number | null;
}

export interface NormalizedGame {
  id: string;
  sport: Sport;
  league: League;
  date: Date;
  status: GameStatus;
  seasonType: 1 | 2 | 3;
  championshipLevel: ChampionshipLevel;
  seriesSummary: string | null;
  headline: string | null;
  homeTeam: GameTeam;
  awayTeam: GameTeam;
  winner: 'home' | 'away' | 'tied' | null;
}

export type LocalityBand = 'home' | 'regional' | 'distant' | 'nearest_available';

export interface ScoreBreakdown {
  tier: number;
  league: number;
  locality: number;
  recency: number;
  prominence: number;
}

export interface GameResult {
  game: NormalizedGame;
  reason: string;
  score: number;
  distanceMiles: number | null;
  nearestTeam: { name: string; shortName: string; venueCity: string } | null;
  locality: LocalityBand;
  breakdown: ScoreBreakdown;
}

export type TierId = 'championship' | 'localPlayoffs' | 'localRegular';

export interface TierConfig {
  id: TierId;
  label: string;
  description: string;
}

export const DEFAULT_TIER_ORDER: TierConfig[] = [
  {
    id: 'championship',
    label: 'Championship Game',
    description: 'Super Bowl, NBA Finals, World Series, Stanley Cup, national title games',
  },
  {
    id: 'localPlayoffs',
    label: 'Local Team — Postseason',
    description: 'A nearby team in the playoffs, a bowl game, or March Madness',
  },
  {
    id: 'localRegular',
    label: 'Local Team — Regular Season',
    description: 'A recent regular season game near you',
  },
];

export type ApiResponse =
  | { success: true; result: GameResult; place: PlaceSummary }
  | {
      success: false;
      error: 'city_not_found' | 'ambiguous_city' | 'no_recent_games' | 'api_error';
      message: string;
      candidates?: PlaceSummary[];
    };
