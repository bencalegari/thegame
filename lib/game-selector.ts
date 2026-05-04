import type { NormalizedGame, GameResult, TierId, TIER_WEIGHTS } from './types';

type Weights = Record<TierId, number>;

function deriveWeights(tierOrder: TierId[]): Weights {
  const points = [1000, 500, 200] as const;
  const weights: Weights = { championship: 1000, localPlayoffs: 500, localRegular: 200 };
  tierOrder.forEach((id, i) => {
    weights[id] = points[i] ?? 200;
  });
  return weights;
}

function statusScore(game: NormalizedGame, now: Date): number {
  const ageHours = (now.getTime() - game.date.getTime()) / (1000 * 60 * 60);
  if (ageHours <= 24) return 200;
  if (ageHours <= 72) return 100;
  return 50;
}

function baseScore(game: NormalizedGame, localTeamIds: Set<string>, weights: Weights): number {
  const isLocal =
    localTeamIds.has(`${game.league}:${game.homeTeam.id}`) ||
    localTeamIds.has(`${game.league}:${game.awayTeam.id}`);

  if (game.isChampionship) return isLocal ? weights.championship + 100 : weights.championship;
  if (game.seasonType === 3 && isLocal) return weights.localPlayoffs;
  if (game.seasonType === 2 && isLocal) return weights.localRegular;
  if (game.seasonType === 1 && isLocal) return 50;
  return 0;
}

function buildReason(game: NormalizedGame, localTeamIds: Set<string>): string {
  const isLocal =
    localTeamIds.has(`${game.league}:${game.homeTeam.id}`) ||
    localTeamIds.has(`${game.league}:${game.awayTeam.id}`);

  const localTeamName = localTeamIds.has(`${game.league}:${game.homeTeam.id}`)
    ? game.homeTeam.name
    : localTeamIds.has(`${game.league}:${game.awayTeam.id}`)
    ? game.awayTeam.name
    : null;

  if (game.isChampionship) {
    const eventName =
      game.league === 'nfl' ? 'Super Bowl' :
      game.league === 'nba' ? 'NBA Finals' :
      game.league === 'mlb' ? 'World Series' :
      'Stanley Cup Finals';
    return `The ${eventName} is always The Game — everyone's watching.`;
  }

  if (game.seasonType === 3 && isLocal) {
    const roundInfo = game.headline ? ` (${game.headline})` : '';
    return `${localTeamName} just played in the playoffs${roundInfo}.`;
  }

  if (game.seasonType === 2 && isLocal) {
    return `${localTeamName} played recently. No playoff action in the last 3 days.`;
  }

  return 'This is the most relevant recent game.';
}

export function selectTheGame(
  allGames: NormalizedGame[],
  localTeamIds: Set<string>,
  tierOrder: TierId[] = ['championship', 'localPlayoffs', 'localRegular'],
): GameResult | null {
  const now = new Date();
  const weights = deriveWeights(tierOrder);

  const candidates = allGames
    .map((game) => {
      if (game.status !== 'final') return null;
      const base = baseScore(game, localTeamIds, weights);
      if (base === 0) return null;
      const total = base + statusScore(game, now);
      return { game, score: total };
    })
    .filter((c): c is { game: NormalizedGame; score: number } => c !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.game.date.getTime() - a.game.date.getTime();
  });

  const best = candidates[0];
  return {
    game: best.game,
    score: best.score,
    reason: buildReason(best.game, localTeamIds),
  };
}
