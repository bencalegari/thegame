export interface NationalEvent {
  id: string;
  name: string;
  sportIcon: string;
  statusLabel: string;
  isLive: boolean;
  source: 'espn' | 'calendar';
}

const ESPN_SPORT_CONFIGS = [
  { path: 'golf/pga',               icon: '⛳', label: 'PGA Tour' },
  { path: 'golf/lpga',              icon: '⛳', label: 'LPGA' },
  { path: 'tennis/atp',             icon: '🎾', label: 'ATP Tennis' },
  { path: 'tennis/wta',             icon: '🎾', label: 'WTA Tennis' },
  { path: 'racing/f1',              icon: '🏎️', label: 'Formula 1' },
  { path: 'racing/nascar',          icon: '🏁', label: 'NASCAR' },
  { path: 'mma/ufc',                icon: '🥊', label: 'UFC' },
  { path: 'soccer/fifa.world',      icon: '⚽', label: 'FIFA World Cup' },
  { path: 'soccer/concacaf.gold_cup', icon: '⚽', label: 'Gold Cup' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function classifyEspnEvent(event: any): NationalEvent | null {
  const statusName: string = event.status?.type?.name ?? '';
  const completed: boolean = event.status?.type?.completed ?? false;
  const startDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const now = new Date();
  const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const hoursSinceEnd = endDate
    ? (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
    : null;

  const icon = ESPN_SPORT_CONFIGS.find((c) =>
    event._path && event._path.includes(c.path.split('/')[0])
  )?.icon ?? '🏆';

  // Currently in progress
  if (statusName === 'STATUS_IN_PROGRESS') {
    return {
      id: String(event.id),
      name: event.name ?? event.shortName ?? 'Event',
      sportIcon: event._icon ?? icon,
      statusLabel: 'Live',
      isLive: true,
      source: 'espn',
    };
  }

  // Finished within the past 30 hours — people are still talking about it
  if (completed && hoursSinceEnd !== null && hoursSinceEnd >= 0 && hoursSinceEnd <= 30) {
    return {
      id: String(event.id),
      name: event.name ?? event.shortName ?? 'Event',
      sportIcon: event._icon ?? icon,
      statusLabel: 'Just Finished',
      isLive: false,
      source: 'espn',
    };
  }

  // Final with no endDate — use start date (good for tennis/golf where event = tournament)
  if (completed && hoursSinceEnd === null && hoursSinceStart >= 0 && hoursSinceStart <= 30) {
    return {
      id: String(event.id),
      name: event.name ?? event.shortName ?? 'Event',
      sportIcon: event._icon ?? icon,
      statusLabel: 'Just Finished',
      isLive: false,
      source: 'espn',
    };
  }

  return null;
}

async function fetchEspnNationalEvents(): Promise<NationalEvent[]> {
  const results = await Promise.allSettled(
    ESPN_SPORT_CONFIGS.map(async (config) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${config.path}/scoreboard?limit=10`;
      const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
      if (!res.ok) return [];
      const data = await res.json();
      const events: NationalEvent[] = [];
      for (const event of data.events ?? []) {
        event._path = config.path;
        event._icon = config.icon;
        const classified = classifyEspnEvent(event);
        if (classified) events.push(classified);
      }
      return events;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<NationalEvent[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

// ── Static calendar for events ESPN doesn't cover well ──────────────────────

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (d.getMonth() === month - 1) {
    if (d.getDay() === weekday) {
      count++;
      if (count === n) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
  return new Date(year, month - 1, 1);
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month, 0); // last day of month
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
  return d;
}

function calendarEvent(
  id: string, name: string, icon: string,
  start: Date, durationDays: number
): NationalEvent | null {
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  const now = new Date();
  const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const hoursSinceEnd = (now.getTime() - end.getTime()) / (1000 * 60 * 60);

  if (hoursSinceStart >= 0 && hoursSinceEnd < 0) {
    return { id, name, sportIcon: icon, statusLabel: 'Ongoing', isLive: false, source: 'calendar' };
  }
  if (hoursSinceEnd >= 0 && hoursSinceEnd <= 30) {
    return { id, name, sportIcon: icon, statusLabel: 'Just Finished', isLive: false, source: 'calendar' };
  }
  return null;
}

function getCalendarEvents(): NationalEvent[] {
  const y = new Date().getFullYear();
  const events: (NationalEvent | null)[] = [];

  // Horse Racing Triple Crown
  const kentuckyDerby = nthWeekday(y, 5, 6, 1);   // first Saturday in May
  events.push(calendarEvent('ky-derby', 'Kentucky Derby', '🐎', kentuckyDerby, 1));

  const preakness = new Date(kentuckyDerby);
  preakness.setDate(kentuckyDerby.getDate() + 14);  // ~2 weeks after KD
  events.push(calendarEvent('preakness', 'Preakness Stakes', '🐎', preakness, 1));

  const belmont = new Date(kentuckyDerby);
  belmont.setDate(kentuckyDerby.getDate() + 35);    // ~5 weeks after KD
  events.push(calendarEvent('belmont', 'Belmont Stakes', '🐎', belmont, 1));

  // Indianapolis 500 — last Sunday in May
  const indy500 = lastWeekday(y, 5, 0);
  events.push(calendarEvent('indy500', 'Indianapolis 500', '🏎️', indy500, 1));

  // Tour de France — first Saturday in July for ~23 days
  const tdf = nthWeekday(y, 7, 6, 1);
  events.push(calendarEvent('tdf', 'Tour de France', '🚴', tdf, 23));

  // Boston Marathon — third Monday in April
  const boston = nthWeekday(y, 4, 1, 3);
  events.push(calendarEvent('boston-marathon', 'Boston Marathon', '🏃', boston, 1));

  // Summer Olympics — every 4 years (2024, 2028, ...)
  const olympicYears = [2024, 2028, 2032];
  if (olympicYears.includes(y)) {
    const olympicsStart = new Date(y, 6, 26); // ~July 26
    events.push(calendarEvent('summer-olympics', 'Summer Olympics', '🏅', olympicsStart, 17));
  }

  // Winter Olympics — every 4 years (2026, 2030, ...)
  const winterOlympicYears = [2026, 2030, 2034];
  if (winterOlympicYears.includes(y)) {
    const winterStart = new Date(y, 1, 6); // ~Feb 6
    events.push(calendarEvent('winter-olympics', 'Winter Olympics', '⛷️', winterStart, 17));
  }

  return events.filter((e): e is NationalEvent => e !== null);
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function fetchNationalEvents(): Promise<NationalEvent[]> {
  const [espnEvents, calendarEvents] = await Promise.all([
    fetchEspnNationalEvents(),
    Promise.resolve(getCalendarEvents()),
  ]);

  const all = [...espnEvents, ...calendarEvents];

  // Deduplicate by name (ESPN and calendar may overlap for some events)
  const seen = new Set<string>();
  return all.filter((e) => {
    const key = e.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
