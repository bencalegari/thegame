import type { NormalizedGame, League, Sport, GameStatus } from './types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUE_CONFIG: Array<{ sport: Sport; league: League; path: string; activeMonths: number[] }> = [
  {
    sport: 'football',
    league: 'nfl',
    path: 'football/nfl',
    activeMonths: [9, 10, 11, 12, 1, 2],
  },
  {
    sport: 'basketball',
    league: 'nba',
    path: 'basketball/nba',
    activeMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
  },
  {
    sport: 'baseball',
    league: 'mlb',
    path: 'baseball/mlb',
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    sport: 'hockey',
    league: 'nhl',
    path: 'hockey/nhl',
    activeMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
  },
];

const CHAMPIONSHIP_KEYWORDS = [
  'super bowl',
  'nba finals',
  'world series',
  'stanley cup',
  'nfl championship',
  'nba championship',
];

function isChampionshipGame(headline: string | null, notes: string[]): boolean {
  const texts = [headline, ...notes].map((t) => (t ?? '').toLowerCase());
  return texts.some((t) => CHAMPIONSHIP_KEYWORDS.some((kw) => t.includes(kw)));
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function normalizeStatus(statusName: string): GameStatus {
  if (statusName === 'STATUS_IN_PROGRESS' || statusName === 'STATUS_HALFTIME') return 'in_progress';
  if (statusName === 'STATUS_FINAL' || statusName === 'STATUS_FINAL_OVERTIME' || statusName === 'STATUS_FINAL_PENALTY') return 'final';
  return 'scheduled';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGame(raw: any, sport: Sport, league: League): NormalizedGame | null {
  try {
    const comp = raw.competitions?.[0];
    if (!comp) return null;

    const statusName = comp.status?.type?.name ?? 'STATUS_SCHEDULED';
    const status = normalizeStatus(statusName);

    const competitors: Array<{ id: string; name: string; abbreviation: string; score: number; homeAway: string }> =
      (comp.competitors ?? []).map((c: any) => ({
        id: String(c.team?.id ?? ''),
        name: c.team?.displayName ?? c.team?.name ?? '',
        abbreviation: c.team?.abbreviation ?? '',
        score: parseInt(c.score ?? '0', 10) || 0,
        homeAway: c.homeAway ?? 'away',
      }));

    const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
    if (!home || !away) return null;

    const notes: string[] = (comp.notes ?? []).map((n: any) => String(n.headline ?? ''));
    const headline = notes[0] ?? null;
    const seriesSummary: string | null = comp.series?.summary ?? null;

    let winner: NormalizedGame['winner'] = null;
    if (status === 'final') {
      if (home.score > away.score) winner = 'home';
      else if (away.score > home.score) winner = 'away';
      else winner = 'tied';
    }

    return {
      id: String(raw.id ?? comp.id ?? ''),
      sport,
      league,
      date: new Date(raw.date ?? comp.date ?? Date.now()),
      status,
      seasonType: (raw.season?.type ?? 2) as 1 | 2 | 3,
      isChampionship: isChampionshipGame(headline, notes),
      seriesSummary,
      headline,
      homeTeam: { id: home.id, name: home.name, abbreviation: home.abbreviation, score: home.score },
      awayTeam: { id: away.id, name: away.name, abbreviation: away.abbreviation, score: away.score },
      winner,
    };
  } catch {
    return null;
  }
}

// ESPN rejects some datacenter traffic that arrives without a browser-ish
// User-Agent, which is the usual reason this works locally but not on a VPS.
export const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

export interface ScoreboardFetch {
  league: League;
  dateStr: string;
  url: string;
  ok: boolean;
  httpStatus: number | null;
  eventCount: number;
  games: NormalizedGame[];
  error: string | null;
}

async function fetchScoreboard(
  sport: Sport,
  league: League,
  path: string,
  dateStr: string,
  cacheSeconds: number
): Promise<ScoreboardFetch> {
  const url = `${ESPN_BASE}/${path}/scoreboard?dates=${dateStr}&limit=100`;
  const base = { league, dateStr, url };
  const init: RequestInit =
    cacheSeconds > 0
      ? { headers: ESPN_HEADERS, next: { revalidate: cacheSeconds } }
      : { headers: ESPN_HEADERS, cache: 'no-store' };
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      return { ...base, ok: false, httpStatus: res.status, eventCount: 0, games: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const rawEvents: unknown[] = data.events ?? [];
    const games: NormalizedGame[] = rawEvents
      .map((e) => normalizeGame(e, sport, league))
      .filter((g: NormalizedGame | null): g is NormalizedGame => g !== null);
    return { ...base, ok: true, httpStatus: res.status, eventCount: rawEvents.length, games, error: null };
  } catch (err) {
    const cause = (err as { cause?: { code?: string } })?.cause?.code;
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      ok: false,
      httpStatus: null,
      eventCount: 0,
      games: [],
      error: cause ? `${message} (${cause})` : message,
    };
  }
}

export interface RecentGamesReport {
  serverTime: string;
  timeZone: string;
  month: number;
  dates: string[];
  activeLeagues: League[];
  fetches: ScoreboardFetch[];
  games: NormalizedGame[];
}

function dedupe(games: NormalizedGame[]): NormalizedGame[] {
  const seen = new Set<string>();
  return games.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
}

export async function fetchRecentGamesReport(
  daysBack: number = 3,
  cacheSeconds: number = 300
): Promise<RecentGamesReport> {
  const now = new Date();
  const month = now.getMonth() + 1;

  const dates: string[] = [];
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(toDateString(d));
  }

  // Also include tomorrow to catch games scheduled for today that may appear as tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  dates.push(toDateString(tomorrow));

  const activeLeagues = LEAGUE_CONFIG.filter((l) => l.activeMonths.includes(month));

  const fetches = await Promise.all(
    activeLeagues.flatMap((config) =>
      dates.map((dateStr) =>
        fetchScoreboard(config.sport, config.league, config.path, dateStr, cacheSeconds)
      )
    )
  );

  return {
    serverTime: now.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    month,
    dates,
    activeLeagues: activeLeagues.map((l) => l.league),
    fetches,
    games: dedupe(fetches.flatMap((f) => f.games)),
  };
}

export class EspnUnreachableError extends Error {
  constructor(public readonly detail: string) {
    super(`ESPN unreachable: ${detail}`);
    this.name = 'EspnUnreachableError';
  }
}

export async function fetchRecentGames(daysBack: number = 3): Promise<NormalizedGame[]> {
  const report = await fetchRecentGamesReport(daysBack);

  const failed = report.fetches.filter((f) => !f.ok);
  if (failed.length > 0) {
    // Surface in Coolify container logs — previously these were swallowed silently.
    for (const f of failed) {
      console.error(`[espn] ${f.league} ${f.dateStr} failed: ${f.error} — ${f.url}`);
    }
  }

  // Every request failed: this is a connectivity/blocking problem, not "no games".
  if (report.fetches.length > 0 && failed.length === report.fetches.length) {
    const reasons = [...new Set(failed.map((f) => f.error))].join(', ');
    throw new EspnUnreachableError(`${failed.length}/${report.fetches.length} requests failed (${reasons})`);
  }

  return report.games;
}
