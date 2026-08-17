'use client';

import type { GameResult } from '@/lib/types';

interface Props {
  result: GameResult;
  city: string;
}

const LEAGUE_LABELS: Record<string, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  nhl: 'NHL',
  cfb: 'College Football',
  cbb: 'College Basketball',
};

const LEAGUE_COLORS: Record<string, string> = {
  nfl: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  nba: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  mlb: 'bg-red-500/20 text-red-300 border-red-500/30',
  nhl: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  cfb: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cbb: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const SPORT_ICONS: Record<string, string> = {
  football: '🏈',
  basketball: '🏀',
  baseball: '⚾',
  hockey: '🏒',
};

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function ResultCard({ result, city }: Props) {
  const { game, reason } = result;
  const { homeTeam, awayTeam, status, league, sport, winner, seriesSummary, headline } = game;

  const leagueLabel = LEAGUE_LABELS[league] ?? league.toUpperCase();
  const leagueColor = LEAGUE_COLORS[league] ?? 'bg-white/10 text-white/70 border-white/20';
  const sportIcon = SPORT_ICONS[sport] ?? '🏆';

  const statusPill = (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60 border border-white/10">
      FINAL
    </span>
  );

  const winnerTeam = winner === 'home' ? homeTeam : winner === 'away' ? awayTeam : null;

  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${leagueColor}`}>
            {sportIcon} {leagueLabel}
          </span>
          {game.seasonType === 3 && (
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/30">
              PLAYOFFS
            </span>
          )}
          {game.championshipLevel === 'national' && (
            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300 border border-yellow-500/30">
              🏆 CHAMPIONSHIP
            </span>
          )}
          {game.championshipLevel === 'conference' && (
            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200/80 border border-yellow-500/20">
              CONFERENCE TITLE
            </span>
          )}
        </div>
        {statusPill}
      </div>

      {/* Matchup */}
      <div className="mb-4 text-center">
        <p className="mb-1 text-xs text-white/40 uppercase tracking-widest">The Game</p>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 text-right">
            <p className="text-lg font-bold text-white leading-tight">
              {awayTeam.rank && <span className="text-white/50 mr-1">#{awayTeam.rank}</span>}
              {awayTeam.name}
            </p>
            <p className="text-xs text-white/40">{awayTeam.abbreviation} (away)</p>
          </div>
          <div className="flex flex-col items-center">
            {status !== 'scheduled' ? (
              <div className="text-3xl font-black text-white tabular-nums">
                {awayTeam.score}
                <span className="mx-2 text-white/30">–</span>
                {homeTeam.score}
              </div>
            ) : (
              <div className="text-2xl font-black text-white/40">vs</div>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-lg font-bold text-white leading-tight">
              {homeTeam.rank && <span className="text-white/50 mr-1">#{homeTeam.rank}</span>}
              {homeTeam.name}
            </p>
            <p className="text-xs text-white/40">{homeTeam.abbreviation} (home)</p>
          </div>
        </div>
      </div>

      {/* Winner */}
      {winnerTeam && (
        <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-green-400">
            🏆 {winnerTeam.name} wins
            {winner === 'tied' ? '' : ` ${Math.max(homeTeam.score, awayTeam.score)}–${Math.min(homeTeam.score, awayTeam.score)}`}
          </p>
        </div>
      )}
      {winner === 'tied' && status === 'final' && (
        <div className="mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-white/60">Game ended tied</p>
        </div>
      )}

      {/* Series summary */}
      {seriesSummary && (
        <div className="mb-4 rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-center">
          <p className="text-sm text-purple-300">{seriesSummary}</p>
          {headline && <p className="text-xs text-purple-400/70 mt-0.5">{headline}</p>}
        </div>
      )}

      {/* Why this is The Game */}
      <div className="mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Why this is The Game</p>
        <p className="text-sm text-white/80">{reason}</p>
      </div>

      {/* Timestamp */}
      <p className="text-center text-xs text-white/30">
        {formatDate(game.date)} · {city}
        {result.distanceMiles !== null && result.nearestTeam && (
          <> · {result.nearestTeam.shortName} plays {result.distanceMiles} mi away</>
        )}
      </p>
    </div>
  );
}
