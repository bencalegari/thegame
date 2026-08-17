import { LEAGUE_CONFIG } from './espn-client';
import { nearestTeamByLeague } from './teams';
import { RELEVANT_TEAM_MI } from './scoring-config';
import type { Coordinates } from './teams';
import type { League } from './types';

const NATIONAL_LEAGUES: League[] = ['nfl', 'nba', 'mlb', 'nhl'];

export function relevantLeagues(point: Coordinates, month: number): League[] {
  const nearest = nearestTeamByLeague(point);
  return LEAGUE_CONFIG.filter((config) => {
    if (config.championshipMonths.includes(month)) return true;
    if (!config.activeMonths.includes(month)) return false;
    if (NATIONAL_LEAGUES.includes(config.league)) return true;
    const nearestTeam = nearest.get(config.league);
    return nearestTeam !== undefined && nearestTeam.miles <= RELEVANT_TEAM_MI;
  }).map((config) => config.league);
}

export function relevantTeamKeys(point: Coordinates, distances: Map<string, number>): Set<string> {
  const keys = new Set(
    [...distances.entries()].filter(([, miles]) => miles <= RELEVANT_TEAM_MI).map(([key]) => key)
  );
  for (const nearest of nearestTeamByLeague(point).values()) {
    keys.add(nearest.key);
  }
  return keys;
}

export function keepRelevant(relevantKeys: Set<string>) {
  return (league: League, homeId: string, awayId: string) =>
    relevantKeys.has(`${league}:${homeId}`) || relevantKeys.has(`${league}:${awayId}`);
}
