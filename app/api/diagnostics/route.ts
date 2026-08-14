import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentGamesReport } from '@/lib/espn-client';
import { lookupCity } from '@/lib/location-teams';
import { selectTheGame } from '@/lib/game-selector';

/**
 * GET /api/diagnostics?city=Boston
 *
 * Reports exactly why a search returns nothing: server clock/timezone, which
 * dates and leagues were queried, per-request HTTP status against ESPN, and how
 * many games survived each filter stage.
 */
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city') ?? 'Boston';
  const report = await fetchRecentGamesReport(3, 0);

  const failures = report.fetches.filter((f) => !f.ok);
  const finals = report.games.filter((g) => g.status === 'final');

  const mapping = lookupCity(city);
  const localTeamIds = mapping
    ? new Set(mapping.teams.map((t) => `${t.league}:${t.espnId}`))
    : new Set<string>();

  const localFinals = finals.filter(
    (g) => localTeamIds.has(`${g.league}:${g.homeTeam.id}`) || localTeamIds.has(`${g.league}:${g.awayTeam.id}`)
  );
  const selected = mapping ? selectTheGame(report.games, localTeamIds) : null;

  return NextResponse.json({
    server: {
      time: report.serverTime,
      timeZone: report.timeZone,
      month: report.month,
      nodeVersion: process.version,
    },
    query: {
      datesRequested: report.dates,
      activeLeagues: report.activeLeagues,
      note:
        report.activeLeagues.length === 0
          ? 'No leagues are configured as active for this month — every city will return no_recent_games.'
          : null,
    },
    espn: {
      requests: report.fetches.length,
      succeeded: report.fetches.length - failures.length,
      failed: failures.length,
      reachable: failures.length < report.fetches.length,
      perRequest: report.fetches.map((f) => ({
        league: f.league,
        date: f.dateStr,
        httpStatus: f.httpStatus,
        events: f.eventCount,
        error: f.error,
      })),
    },
    pipeline: {
      city,
      cityRecognized: Boolean(mapping),
      canonicalName: mapping?.canonicalName ?? null,
      localTeamIds: [...localTeamIds],
      gamesFetched: report.games.length,
      gamesFinal: finals.length,
      localFinalGames: localFinals.length,
      localFinalSample: localFinals.slice(0, 5).map((g) => ({
        league: g.league,
        matchup: `${g.awayTeam.name} @ ${g.homeTeam.name}`,
        date: g.date.toISOString(),
        seasonType: g.seasonType,
      })),
      selected: selected
        ? {
            matchup: `${selected.game.awayTeam.name} @ ${selected.game.homeTeam.name}`,
            score: selected.score,
            reason: selected.reason,
          }
        : null,
    },
  });
}
