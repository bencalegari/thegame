import type { ChampionshipLevel, NormalizedGame, League, Sport, GameStatus } from './types';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

interface LeagueConfig {
  sport: Sport;
  league: League;
  path: string;
  activeMonths: number[];
  championshipMonths: number[];
  query?: Record<string, string>;
  limit: number;
  daysBack: number;
  cacheSeconds: number;
}

export const LEAGUE_CONFIG: LeagueConfig[] = [
  {
    sport: 'football',
    league: 'nfl',
    path: 'football/nfl',
    activeMonths: [9, 10, 11, 12, 1, 2],
    championshipMonths: [2],
    limit: 100,
    daysBack: 3,
    cacheSeconds: 300,
  },
  {
    sport: 'basketball',
    league: 'nba',
    path: 'basketball/nba',
    activeMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
    championshipMonths: [6],
    limit: 100,
    daysBack: 3,
    cacheSeconds: 300,
  },
  {
    sport: 'baseball',
    league: 'mlb',
    path: 'baseball/mlb',
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    championshipMonths: [10, 11],
    limit: 100,
    daysBack: 3,
    cacheSeconds: 300,
  },
  {
    sport: 'hockey',
    league: 'nhl',
    path: 'hockey/nhl',
    activeMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6],
    championshipMonths: [6],
    limit: 100,
    daysBack: 3,
    cacheSeconds: 300,
  },
  {
    sport: 'football',
    league: 'cfb',
    path: 'football/college-football',
    activeMonths: [8, 9, 10, 11, 12, 1],
    championshipMonths: [1],
    query: { groups: '80' },
    limit: 300,
    daysBack: 8,
    cacheSeconds: 600,
  },
  {
    sport: 'basketball',
    league: 'cbb',
    path: 'basketball/mens-college-basketball',
    activeMonths: [11, 12, 1, 2, 3, 4],
    championshipMonths: [3, 4],
    query: { groups: '50' },
    limit: 400,
    daysBack: 3,
    cacheSeconds: 600,
  },
];

const NATIONAL_CHAMPIONSHIP_KEYWORDS = [
  'super bowl',
  'nba finals',
  'world series',
  'stanley cup final',
  'national championship',
  'ncaa championship game',
];

const CONFERENCE_CHAMPIONSHIP_PATTERN = /championship|title game|conference tournament/;

function classifyChampionship(headline: string | null, notes: string[]): ChampionshipLevel {
  const text = [headline, ...notes]
    .map((t) => (t ?? '').toLowerCase())
    .join(' | ');
  if (!text.trim()) return null;
  if (NATIONAL_CHAMPIONSHIP_KEYWORDS.some((kw) => text.includes(kw))) return 'national';
  if (CONFERENCE_CHAMPIONSHIP_PATTERN.test(text)) return 'conference';
  return null;
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

function normalizeRank(value: unknown): number | null {
  const rank = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(rank) || rank < 1 || rank > 25) return null;
  return rank;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawCompetitorIds(raw: any): { home: string; away: string } | null {
  const competitors = raw?.competitions?.[0]?.competitors;
  if (!Array.isArray(competitors) || competitors.length < 2) return null;
  const home = competitors.find((c: any) => c.homeAway === 'home') ?? competitors[0];
  const away = competitors.find((c: any) => c.homeAway === 'away') ?? competitors[1];
  return { home: String(home?.team?.id ?? ''), away: String(away?.team?.id ?? '') };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawLooksLikeChampionship(raw: any): boolean {
  const comp = raw?.competitions?.[0];
  const notes: string[] = (comp?.notes ?? []).map((n: any) => String(n?.headline ?? ''));
  return classifyChampionship(notes[0] ?? null, notes) !== null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGame(raw: any, sport: Sport, league: League): NormalizedGame | null {
  try {
    const comp = raw.competitions?.[0];
    if (!comp) return null;

    const statusName = comp.status?.type?.name ?? 'STATUS_SCHEDULED';
    const status = normalizeStatus(statusName);

    const competitors = (comp.competitors ?? []).map((c: any) => ({
      id: String(c.team?.id ?? ''),
      name: c.team?.displayName ?? c.team?.name ?? '',
      shortName: c.team?.location ?? c.team?.shortDisplayName ?? c.team?.name ?? '',
      abbreviation: c.team?.abbreviation ?? '',
      score: parseInt(c.score ?? '0', 10) || 0,
      rank: normalizeRank(c.curatedRank?.current),
      homeAway: c.homeAway ?? 'away',
    }));

    const home = competitors.find((c: { homeAway: string }) => c.homeAway === 'home') ?? competitors[0];
    const away = competitors.find((c: { homeAway: string }) => c.homeAway === 'away') ?? competitors[1];
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
      championshipLevel: classifyChampionship(headline, notes),
      seriesSummary,
      headline,
      homeTeam: {
        id: home.id,
        name: home.name,
        shortName: home.shortName,
        abbreviation: home.abbreviation,
        score: home.score,
        rank: home.rank,
      },
      awayTeam: {
        id: away.id,
        name: away.name,
        shortName: away.shortName,
        abbreviation: away.abbreviation,
        score: away.score,
        rank: away.rank,
      },
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
  truncated: boolean;
  games: NormalizedGame[];
  error: string | null;
}

export type KeepPredicate = (league: League, homeId: string, awayId: string) => boolean;

const memo = new Map<string, { expiresAt: number; body: unknown }>();

async function fetchJson(url: string, cacheSeconds: number): Promise<unknown> {
  if (cacheSeconds > 0) {
    const hit = memo.get(url);
    if (hit && hit.expiresAt > Date.now()) return hit.body;
  }

  const init: RequestInit =
    cacheSeconds > 0
      ? { headers: ESPN_HEADERS, next: { revalidate: cacheSeconds } }
      : { headers: ESPN_HEADERS, cache: 'no-store' };

  const res = await fetch(url, init);
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { httpStatus: res.status });

  const body = await res.json();
  if (cacheSeconds > 0) {
    memo.set(url, { expiresAt: Date.now() + cacheSeconds * 1000, body });
  }
  return body;
}

async function fetchScoreboard(
  config: LeagueConfig,
  dateRange: string,
  cacheSeconds: number,
  keep?: KeepPredicate
): Promise<ScoreboardFetch> {
  const params = new URLSearchParams({
    dates: dateRange,
    limit: String(config.limit),
    ...(config.query ?? {}),
  });
  const url = `${ESPN_BASE}/${config.path}/scoreboard?${params}`;
  const base = { league: config.league, dateStr: dateRange, url };

  try {
    const data = (await fetchJson(url, cacheSeconds)) as { events?: unknown[] };
    const rawEvents: unknown[] = data.events ?? [];
    const games = rawEvents
      .filter((event) => {
        if (!keep) return true;
        const ids = rawCompetitorIds(event);
        if (!ids) return false;
        return keep(config.league, ids.home, ids.away) || rawLooksLikeChampionship(event);
      })
      .map((e) => normalizeGame(e, config.sport, config.league))
      .filter((g: NormalizedGame | null): g is NormalizedGame => g !== null);

    return {
      ...base,
      ok: true,
      httpStatus: 200,
      eventCount: rawEvents.length,
      truncated: rawEvents.length >= config.limit,
      games,
      error: rawEvents.length >= config.limit ? `truncated at limit=${config.limit}` : null,
    };
  } catch (err) {
    const httpStatus = (err as { httpStatus?: number }).httpStatus ?? null;
    const cause = (err as { cause?: { code?: string } })?.cause?.code;
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      ok: false,
      httpStatus,
      eventCount: 0,
      truncated: false,
      games: [],
      error: cause ? `${message} (${cause})` : message,
    };
  }
}

export interface RecentGamesReport {
  serverTime: string;
  timeZone: string;
  month: number;
  leagueWindows: Array<{ league: League; range: string }>;
  activeLeagues: League[];
  skippedLeagues: League[];
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

function dateRangeFor(now: Date, daysBack: number): string {
  const start = new Date(now);
  start.setDate(start.getDate() - (daysBack - 1));
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  return `${toDateString(start)}-${toDateString(end)}`;
}

export interface FetchOptions {
  leagues?: League[];
  cacheSeconds?: number;
  keep?: KeepPredicate;
  asOf?: Date;
}

export async function fetchRecentGamesReport(options: FetchOptions = {}): Promise<RecentGamesReport> {
  const now = options.asOf ?? new Date();
  const month = now.getMonth() + 1;

  const inSeason = LEAGUE_CONFIG.filter(
    (l) => l.activeMonths.includes(month) || l.championshipMonths.includes(month)
  );
  const requested = options.leagues;
  const selected = requested ? inSeason.filter((l) => requested.includes(l.league)) : inSeason;
  const skipped = inSeason.filter((l) => !selected.includes(l));

  const windows = selected.map((config) => ({
    config,
    range: dateRangeFor(now, config.daysBack),
  }));

  const fetches = await Promise.all(
    windows.map(({ config, range }) =>
      fetchScoreboard(config, range, options.cacheSeconds ?? config.cacheSeconds, options.keep)
    )
  );

  return {
    serverTime: now.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    month,
    leagueWindows: windows.map(({ config, range }) => ({ league: config.league, range })),
    activeLeagues: selected.map((l) => l.league),
    skippedLeagues: skipped.map((l) => l.league),
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

export async function fetchRecentGames(options: FetchOptions = {}): Promise<NormalizedGame[]> {
  const report = await fetchRecentGamesReport(options);

  const failed = report.fetches.filter((f) => !f.ok);
  if (failed.length > 0) {
    // Surface in Coolify container logs — previously these were swallowed silently.
    for (const f of failed) {
      console.error(`[espn] ${f.league} ${f.dateStr} failed: ${f.error} — ${f.url}`);
    }
  }

  for (const f of report.fetches.filter((f) => f.truncated)) {
    console.warn(`[espn] ${f.league} ${f.dateStr} hit the event limit — some games were not returned`);
  }

  // Every request failed: this is a connectivity/blocking problem, not "no games".
  if (report.fetches.length > 0 && failed.length === report.fetches.length) {
    const reasons = [...new Set(failed.map((f) => f.error))].join(', ');
    throw new EspnUnreachableError(`${failed.length}/${report.fetches.length} requests failed (${reasons})`);
  }

  return report.games;
}
