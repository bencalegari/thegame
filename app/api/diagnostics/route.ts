import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentGamesReport } from '@/lib/espn-client';
import { resolvePlace, getPlaceById, toPlaceSummary } from '@/lib/places';
import { nearbyTeams, nearestByLeague, teamDistances } from '@/lib/teams';
import { scoreGames } from '@/lib/game-selector';
import { keepRelevant, relevantLeagues, relevantTeamKeys } from '@/lib/relevance';

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') ?? 'Boston';
  const placeId = req.nextUrl.searchParams.get('placeId');

  const resolution = placeId ? null : resolvePlace(city);
  const place = placeId ? getPlaceById(placeId) : resolution?.kind === 'exact' ? resolution.place : null;

  if (!place) {
    return NextResponse.json({
      query: { city, placeId },
      resolution: {
        kind: resolution?.kind ?? 'none',
        candidates:
          resolution?.kind === 'ambiguous' ? resolution.candidates.map(toPlaceSummary) : [],
      },
    });
  }

  const asOfParam = req.nextUrl.searchParams.get('asOf');
  const asOf = asOfParam
    ? new Date(`${asOfParam.slice(0, 4)}-${asOfParam.slice(4, 6)}-${asOfParam.slice(6, 8)}T18:00:00Z`)
    : new Date();
  const month = asOf.getMonth() + 1;
  const distances = teamDistances(place);
  const relevantKeys = relevantTeamKeys(place, distances);
  const leagues = relevantLeagues(place, month);

  const report = await fetchRecentGamesReport({
    leagues,
    cacheSeconds: 0,
    keep: keepRelevant(relevantKeys),
    asOf,
  });

  const failures = report.fetches.filter((f) => !f.ok);
  const finals = report.games.filter((g) => g.status === 'final');
  const ranked = scoreGames(report.games, { place, teamDistances: distances, now: asOf });

  return NextResponse.json({
    server: {
      time: report.serverTime,
      timeZone: report.timeZone,
      month: report.month,
      nodeVersion: process.version,
    },
    place: {
      ...toPlaceSummary(place),
      lat: place.lat,
      lng: place.lng,
      country: place.country,
      resolvedFrom: placeId ? 'placeId' : 'text',
    },
    teams: {
      relevantTeamCount: relevantKeys.size,
      nearest: nearbyTeams(place, Infinity)
        .slice(0, 10)
        .map(({ team, miles }) => ({
          key: team.key,
          name: team.name,
          venueCity: team.venueCity,
          miles: Math.round(miles),
        })),
      nearestByLeague: Object.fromEntries(
        [...nearestByLeague(place).entries()].map(([league, miles]) => [league, Math.round(miles)])
      ),
    },
    query: {
      leaguesFetched: report.activeLeagues,
      leaguesSkipped: report.skippedLeagues,
      windows: report.leagueWindows,
    },
    espn: {
      requests: report.fetches.length,
      succeeded: report.fetches.length - failures.length,
      failed: failures.length,
      reachable: failures.length < report.fetches.length,
      perRequest: report.fetches.map((f) => ({
        league: f.league,
        dates: f.dateStr,
        httpStatus: f.httpStatus,
        events: f.eventCount,
        truncated: f.truncated,
        kept: f.games.length,
        error: f.error,
      })),
    },
    pipeline: {
      gamesKept: report.games.length,
      gamesFinal: finals.length,
      scoredCandidates: ranked.length,
      top: ranked.slice(0, 5).map((c) => ({
        matchup: `${c.game.awayTeam.name} @ ${c.game.homeTeam.name}`,
        league: c.game.league,
        date: c.game.date.toISOString(),
        seasonType: c.game.seasonType,
        championshipLevel: c.game.championshipLevel,
        miles: Number.isFinite(c.miles) ? Math.round(c.miles) : null,
        locality: c.locality,
        score: Math.round(c.score * 10) / 10,
        breakdown: c.breakdown,
      })),
    },
  });
}
