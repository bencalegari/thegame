import {
  LEAGUE_WEIGHT,
  localityBand,
  localityFactor,
  prominenceFactor,
  recencyFactor,
} from './scoring-config';
import { teamByKey } from './teams';
import type {
  GameResult,
  LocalityBand,
  NormalizedGame,
  Place,
  ScoreBreakdown,
  TierId,
} from './types';

type Weights = Record<TierId, number>;

export interface SelectionContext {
  place: Place;
  teamDistances: Map<string, number>;
  tierOrder?: TierId[];
  now?: Date;
}

export interface ScoredGame {
  game: NormalizedGame;
  score: number;
  miles: number;
  nearestTeamKey: string | null;
  locality: LocalityBand;
  breakdown: ScoreBreakdown;
}

const PRESEASON_BASE = 50;

function deriveWeights(tierOrder: TierId[]): Weights {
  const points = [1000, 500, 200] as const;
  const weights: Weights = { championship: 1000, localPlayoffs: 500, localRegular: 200 };
  tierOrder.forEach((id, i) => {
    weights[id] = points[i] ?? 200;
  });
  return weights;
}

function tierBase(game: NormalizedGame, weights: Weights): number {
  if (game.championshipLevel === 'national') return weights.championship;
  if (game.seasonType === 3 || game.championshipLevel === 'conference') return weights.localPlayoffs;
  if (game.seasonType === 1) return PRESEASON_BASE;
  return weights.localRegular;
}

function bestRank(game: NormalizedGame): number | null {
  const ranks = [game.homeTeam.rank, game.awayTeam.rank].filter(
    (r): r is number => typeof r === 'number'
  );
  return ranks.length > 0 ? Math.min(...ranks) : null;
}

function nearestTeamOf(
  game: NormalizedGame,
  distances: Map<string, number>
): { key: string | null; miles: number } {
  const homeKey = `${game.league}:${game.homeTeam.id}`;
  const awayKey = `${game.league}:${game.awayTeam.id}`;
  const homeMiles = distances.get(homeKey) ?? Infinity;
  const awayMiles = distances.get(awayKey) ?? Infinity;

  if (!Number.isFinite(homeMiles) && !Number.isFinite(awayMiles)) {
    return { key: null, miles: Infinity };
  }
  return homeMiles <= awayMiles ? { key: homeKey, miles: homeMiles } : { key: awayKey, miles: awayMiles };
}

export function scoreGame(game: NormalizedGame, ctx: SelectionContext): ScoredGame {
  const now = ctx.now ?? new Date();
  const weights = deriveWeights(ctx.tierOrder ?? ['championship', 'localPlayoffs', 'localRegular']);

  const nearest = nearestTeamOf(game, ctx.teamDistances);
  const isPostseason = game.seasonType === 3 || game.championshipLevel !== null;
  const proximity = localityFactor(nearest.miles);

  const breakdown: ScoreBreakdown = {
    tier: tierBase(game, weights),
    league: LEAGUE_WEIGHT[game.league][isPostseason ? 'post' : 'regular'],
    locality: game.championshipLevel === 'national' ? 1 + 0.5 * proximity : proximity,
    recency: recencyFactor((now.getTime() - game.date.getTime()) / (1000 * 60 * 60)),
    prominence: prominenceFactor(bestRank(game), game.championshipLevel),
  };

  return {
    game,
    score:
      breakdown.tier *
      breakdown.league *
      breakdown.locality *
      breakdown.recency *
      breakdown.prominence,
    miles: nearest.miles,
    nearestTeamKey: nearest.key,
    locality: localityBand(nearest.miles),
    breakdown,
  };
}

export function scoreGames(games: NormalizedGame[], ctx: SelectionContext): ScoredGame[] {
  return games
    .filter((game) => game.status === 'final')
    .map((game) => scoreGame(game, ctx))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > Math.max(a.score, b.score) * 0.05) return b.score - a.score;
      if (a.miles !== b.miles) return a.miles - b.miles;
      return b.game.date.getTime() - a.game.date.getTime();
    });
}

const NATIONAL_EVENT_NAMES: Record<string, string> = {
  nfl: 'Super Bowl',
  nba: 'NBA Finals',
  mlb: 'World Series',
  nhl: 'Stanley Cup Finals',
  cfb: 'national championship',
  cbb: 'national championship',
};

function teamLabel(key: string | null, game: NormalizedGame): string {
  const record = key ? teamByKey(key) : undefined;
  if (record) return record.name;
  const homeKey = `${game.league}:${game.homeTeam.id}`;
  return key === homeKey ? game.homeTeam.name : game.awayTeam.name;
}

function roundMiles(miles: number): number {
  return miles < 10 ? Math.round(miles * 10) / 10 : Math.round(miles);
}

function buildReason(scored: ScoredGame, place: Place): string {
  const { game } = scored;
  const team = teamLabel(scored.nearestTeamKey, game);
  const miles = roundMiles(scored.miles);

  if (game.championshipLevel === 'national') {
    const event = NATIONAL_EVENT_NAMES[game.league];
    const local = scored.breakdown.locality > 1.25 ? ` And ${team} are in it.` : '';
    return `The ${event} is always the game — everyone's watching.${local}`;
  }

  const stage =
    game.seasonType === 3 || game.championshipLevel === 'conference'
      ? 'in the postseason'
      : game.seasonType === 1
      ? 'a preseason game'
      : '';

  if (scored.locality === 'home') {
    if (stage === 'in the postseason') return `${team} just played a postseason game near ${place.name}.`;
    return `${team} played recently — that's the game around ${place.name}.`;
  }

  if (scored.locality === 'regional') {
    return `No game in ${place.name} itself, but ${team} played ${miles} miles away.`;
  }

  if (scored.locality === 'distant') {
    return `Nothing close to ${place.name}. The nearest recent game was ${team}, ${miles} miles away.`;
  }

  return `Nothing local to ${place.name}. The nearest team is ${team}, ${miles} miles away.`;
}

export function selectTheGame(
  allGames: NormalizedGame[],
  ctx: SelectionContext
): GameResult | null {
  const ranked = scoreGames(allGames, ctx);
  if (ranked.length === 0) return null;

  const best = ranked[0];
  const record = best.nearestTeamKey ? teamByKey(best.nearestTeamKey) : undefined;

  return {
    game: best.game,
    score: best.score,
    reason: buildReason(best, ctx.place),
    distanceMiles: Number.isFinite(best.miles) ? roundMiles(best.miles) : null,
    nearestTeam: record
      ? { name: record.name, shortName: record.shortName, venueCity: record.venueCity }
      : null,
    locality: best.locality,
    breakdown: best.breakdown,
  };
}
