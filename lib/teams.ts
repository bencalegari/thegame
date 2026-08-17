import teamsRaw from '@/data/teams.json';
import { haversineMiles } from './geo';
import type { League, TeamRecord } from './types';

const TEAMS = teamsRaw as TeamRecord[];

const BY_KEY = new Map(TEAMS.map((team) => [team.key, team]));

export interface Coordinates {
  lat: number;
  lng: number;
}

export function allTeams(): TeamRecord[] {
  return TEAMS;
}

export function teamByKey(key: string): TeamRecord | undefined {
  return BY_KEY.get(key);
}

export function teamDistances(point: Coordinates): Map<string, number> {
  const distances = new Map<string, number>();
  for (const team of TEAMS) {
    distances.set(team.key, haversineMiles(point.lat, point.lng, team.lat, team.lng));
  }
  return distances;
}

export function nearbyTeams(
  point: Coordinates,
  maxMiles: number
): Array<{ team: TeamRecord; miles: number }> {
  const results: Array<{ team: TeamRecord; miles: number }> = [];
  for (const team of TEAMS) {
    const miles = haversineMiles(point.lat, point.lng, team.lat, team.lng);
    if (miles <= maxMiles) results.push({ team, miles });
  }
  return results.sort((a, b) => a.miles - b.miles);
}

export function nearestTeamByLeague(point: Coordinates): Map<League, { key: string; miles: number }> {
  const nearest = new Map<League, { key: string; miles: number }>();
  for (const team of TEAMS) {
    const miles = haversineMiles(point.lat, point.lng, team.lat, team.lng);
    const current = nearest.get(team.league);
    if (current === undefined || miles < current.miles) {
      nearest.set(team.league, { key: team.key, miles });
    }
  }
  return nearest;
}

export function nearestByLeague(point: Coordinates): Map<League, number> {
  return new Map(
    [...nearestTeamByLeague(point).entries()].map(([league, nearest]) => [league, nearest.miles])
  );
}
