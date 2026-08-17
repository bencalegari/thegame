#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'data');
const CACHE_DIR = path.join(tmpdir(), 'thegame-build-data');

const GAZ_PLACE_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip';
const GAZ_ZCTA_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip';
const POPEST_URL =
  'https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv';

const ESPN_CORE = 'https://sports.core.api.espn.com/v2/sports';
const ESPN_SITE = 'https://site.api.espn.com/apis/site/v2/sports';

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', VI: 'U.S. Virgin Islands', GU: 'Guam', AS: 'American Samoa',
  MP: 'Northern Mariana Islands',
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario', PE: 'Prince Edward Island',
  QC: 'Quebec', SK: 'Saskatchewan',
};

const STATE_ABBR_BY_NAME = new Map(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

function toStateAbbr(state) {
  const trimmed = String(state ?? '').trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return STATE_ABBR_BY_NAME.get(trimmed.toLowerCase()) ?? trimmed;
}
const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

const LSAD_SUFFIXES = [
  'city and borough',
  'consolidated government',
  'metro government',
  'metropolitan government',
  'unified government',
  'urban county',
  'municipality',
  'corporation',
  'plantation',
  'village',
  'borough',
  'township',
  'town',
  'city',
  'CDP',
  'comunidad',
  'zona urbana',
  'municipio',
  'government',
];

const TEAM_COORD_OVERRIDES = {
  'nba:8': [42.3410, -83.0552],
  'nba:9': [37.7680, -122.3878],
  'nba:17': [40.6826, -73.9754],
  'nba:23': [38.5802, -121.4997],
  'nfl:14': [33.9535, -118.3392],
  'nfl:24': [33.9535, -118.3392],
  'mlb:11': [38.5800, -121.5133],
  'mlb:14': [43.6414, -79.3894],
  'nhl:28': [49.8927, -97.1436],
  'cbb:62': [21.2996, -157.8177],
  'cbb:68': [43.6027, -116.1985],
  'cbb:103': [42.3355, -71.1685],
  'cbb:113': [42.3912, -72.5306],
  'cbb:164': [40.5019, -74.4429],
  'cbb:213': [40.8018, -77.8560],
  'cbb:2016': [31.8760, -91.1370],
  'cbb:2230': [40.8618, -73.8857],
  'cbb:2363': [40.8898, -73.9007],
  'cbb:2463': [34.2410, -118.5290],
  'cbb:2514': [41.4180, -72.8930],
  'cbb:2523': [40.5177, -80.2210],
  'cbb:2529': [41.2224, -73.2440],
  'cbb:2599': [40.7230, -73.7940],
  'cbb:2681': [40.6150, -74.0940],
  'cbb:2771': [42.6690, -71.1580],
  'cbb:2803': [41.9210, -71.5340],
  'cbb:112358': [40.6910, -73.9820],
};

const CANADIAN_VENUE_COORDS = {
  'Scotiabank Arena': [43.6435, -79.3791],
  'Bell Centre': [45.4961, -73.5693],
  'Rogers Arena': [49.2778, -123.1088],
  'Scotiabank Saddledome': [51.0374, -114.0519],
  'Rogers Place': [53.5469, -113.4973],
  'Canadian Tire Centre': [45.2969, -75.9271],
  'Canada Life Centre': [49.8927, -97.1436],
};

const LEAGUES = [
  { league: 'nfl', sport: 'football', sitePath: 'football/nfl', teamsPath: 'football/leagues/nfl/teams?limit=100' },
  { league: 'nba', sport: 'basketball', sitePath: 'basketball/nba', teamsPath: 'basketball/leagues/nba/teams?limit=100' },
  { league: 'mlb', sport: 'baseball', sitePath: 'baseball/mlb', teamsPath: 'baseball/leagues/mlb/teams?limit=100' },
  { league: 'nhl', sport: 'hockey', sitePath: 'hockey/nhl', teamsPath: 'hockey/leagues/nhl/teams?limit=100' },
  {
    league: 'cfb',
    sport: 'football',
    sitePath: 'football/college-football',
    teamsPath: (season) =>
      `football/leagues/college-football/seasons/${season}/types/2/groups/80/teams?limit=300`,
  },
  {
    league: 'cbb',
    sport: 'basketball',
    sitePath: 'basketball/mens-college-basketball',
    teamsPath: (season) =>
      `basketball/leagues/mens-college-basketball/seasons/${season}/types/2/groups/50/teams?limit=500`,
  },
];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function download(url, filename) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const dest = path.join(CACHE_DIR, filename);
  if (existsSync(dest)) return dest;
  log(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

function unzipToText(zipPath) {
  return execFileSync('unzip', ['-p', zipPath], { maxBuffer: 256 * 1024 * 1024 }).toString('latin1');
}

const DISPLAY_NAME_OVERRIDES = {
  'Nashville-Davidson|TN': 'Nashville',
  'Louisville/Jefferson County|KY': 'Louisville',
  'Urban Honolulu|HI': 'Honolulu',
  'Lexington-Fayette|KY': 'Lexington',
  'Boise City|ID': 'Boise',
  'Augusta-Richmond County|GA': 'Augusta',
  'Macon-Bibb County|GA': 'Macon',
  'Athens-Clarke County|GA': 'Athens',
};

const PLACE_COORD_OVERRIDES = {
  'San Francisco|CA': [37.7749, -122.4194],
};

const VENUE_CITY_DISAGREEMENT_MI = 30;

function cleanPlaceName(raw) {
  let name = raw.replace(/\s*\([^)]*\)/g, '').trim();
  for (const suffix of LSAD_SUFFIXES) {
    const tail = ` ${suffix}`;
    if (name.toLowerCase().endsWith(tail.toLowerCase())) {
      name = name.slice(0, -tail.length).trim();
      break;
    }
  }
  return name;
}

function parseGazetteerPlaces(text) {
  const rows = [];
  for (const line of text.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 12 || parts[0] === 'USPS') continue;
    const rawLat = Number(parts[10]);
    const rawLng = Number(parts[11].trim());
    if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) continue;

    const cleaned = cleanPlaceName(parts[3].trim());
    const key = `${cleaned}|${parts[0]}`;
    const name = DISPLAY_NAME_OVERRIDES[key] ?? cleaned;
    const [lat, lng] = PLACE_COORD_OVERRIDES[`${name}|${parts[0]}`] ?? [rawLat, rawLng];

    rows.push({
      state: parts[0],
      geoid: parts[1],
      name,
      lat: Math.round(lat * 1e4) / 1e4,
      lng: Math.round(lng * 1e4) / 1e4,
    });
  }
  return rows;
}

function parseZcta(text) {
  const byZip = new Map();
  for (const line of text.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 7 || parts[0] === 'GEOID') continue;
    const lat = Number(parts[5]);
    const lng = Number(parts[6].trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    byZip.set(parts[0].trim(), [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4]);
  }
  return byZip;
}

function parseCsvLine(line) {
  const out = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(field); field = ''; }
    else field += ch;
  }
  out.push(field);
  return out;
}

function parsePopulations(csv) {
  const lines = csv.split('\n');
  const header = parseCsvLine(lines[0]);
  const col = (name) => header.indexOf(name);
  const iSumlev = col('SUMLEV');
  const iState = col('STATE');
  const iPlace = col('PLACE');
  const iPop = col('POPESTIMATE2024');
  const byGeoid = new Map();
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const parts = parseCsvLine(lines[i].replace(/\r$/, ''));
    if (parts[iSumlev] !== '162') continue;
    const pop = parseInt(parts[iPop], 10);
    if (!Number.isFinite(pop)) continue;
    byGeoid.set(`${parts[iState]}${parts[iPlace]}`, pop);
  }
  return byGeoid;
}

async function espnJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: ESPN_HEADERS });
      if (res.ok) return res.json();
      if (res.status === 404) return null;
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 2) throw new Error(`${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i], i);
      }
    })
  );
  return results;
}

function currentSeason() {
  const now = new Date();
  return now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

async function fetchTeams(config, season, zctaByZip, placeCoords) {
  const pathPart = typeof config.teamsPath === 'function' ? config.teamsPath(season) : config.teamsPath;
  const index = await espnJson(`${ESPN_CORE}/${pathPart}`);
  const refs = (index?.items ?? []).map((item) => item.$ref.replace(/^http:/, 'https:'));
  log(`${config.league}: ${refs.length} teams`);

  const teams = await mapWithConcurrency(refs, 8, async (ref) => {
    const team = await espnJson(ref);
    if (!team || team.isActive === false) return null;

    let venue = team.venue;
    if (!venue?.address && team.venue?.$ref) {
      venue = await espnJson(team.venue.$ref.replace(/^http:/, 'https:'));
    }
    if (!venue?.address) {
      const siteTeam = await espnJson(`${ESPN_SITE}/${config.sitePath}/teams/${team.id}`);
      const siteVenue = siteTeam?.team?.franchise?.venue ?? siteTeam?.team?.venue;
      if (siteVenue?.address) venue = siteVenue;
    }

    const address = venue?.address ?? {};
    const zip = String(address.zipCode ?? '').slice(0, 5);
    const stateAbbr = toStateAbbr(address.state ?? '');
    const zipCoords = zctaByZip.get(zip) ?? null;
    const cityCoords =
      placeCoords.get(`${normalize(address.city ?? '')}|${stateAbbr.toLowerCase()}`) ?? null;
    const zipDisagreesWithCity =
      zipCoords !== null &&
      cityCoords !== null &&
      haversineMiles(zipCoords[0], zipCoords[1], cityCoords[0], cityCoords[1]) >
        VENUE_CITY_DISAGREEMENT_MI;

    const coords =
      TEAM_COORD_OVERRIDES[`${config.league}:${team.id}`] ??
      CANADIAN_VENUE_COORDS[venue?.fullName] ??
      (zipDisagreesWithCity ? cityCoords : zipCoords) ??
      cityCoords ??
      null;

    return {
      key: `${config.league}:${team.id}`,
      espnId: String(team.id),
      league: config.league,
      sport: config.sport,
      name: team.displayName ?? team.name ?? '',
      shortName: team.location ?? team.shortDisplayName ?? team.name ?? '',
      abbreviation: team.abbreviation ?? '',
      lat: coords ? coords[0] : null,
      lng: coords ? coords[1] : null,
      venue: venue?.fullName ?? '',
      venueCity: address.city ?? '',
      venueState: stateAbbr,
    };
  });

  return teams.filter(Boolean);
}

function haversineMiles(aLat, aLng, bLat, bLng) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(rad(aLat)) * Math.cos(rad(bLat));
  return 2 * 3958.7613 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nameVariants(name) {
  const variants = new Set([normalize(name)]);
  const head = name.split(/[-/]/)[0].trim();
  if (head && head !== name) variants.add(normalize(head));
  if (/\scity$/i.test(name)) variants.add(normalize(name.replace(/\scity$/i, '')));
  if (name.toLowerCase().startsWith('saint ')) variants.add(normalize(`St. ${name.slice(6)}`));
  if (/^st\.?\s/i.test(name)) variants.add(normalize(`Saint ${name.replace(/^st\.?\s/i, '')}`));
  return [...variants].filter(Boolean);
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const [placeZip, zctaZip, popCsvPath] = await Promise.all([
    download(GAZ_PLACE_URL, 'gaz_place.zip'),
    download(GAZ_ZCTA_URL, 'gaz_zcta.zip'),
    download(POPEST_URL, 'sub-est.csv'),
  ]);

  const places = parseGazetteerPlaces(unzipToText(placeZip));
  const zctaByZip = parseZcta(unzipToText(zctaZip));
  const populations = parsePopulations(readFileSync(popCsvPath, 'latin1'));
  log(`places: ${places.length}, zctas: ${zctaByZip.size}, populations: ${populations.size}`);

  const best = new Map();
  for (const place of places) {
    const key = `${normalize(place.name)}|${place.state.toLowerCase()}`;
    const pop = populations.get(place.geoid) ?? 0;
    const existing = best.get(key);
    if (!existing || pop > existing.pop) {
      best.set(key, { ...place, pop });
    }
  }

  const rows = [...best.values()]
    .sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name))
    .map((p) => [p.name, p.state, p.lat, p.lng, p.pop, p.geoid]);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, 'places.json'), JSON.stringify(rows));
  log(`wrote data/places.json (${rows.length} rows)`);

  const placeCoords = new Map();
  for (const place of best.values()) {
    const coords = [place.lat, place.lng];
    const state = place.state.toLowerCase();
    for (const variant of nameVariants(place.name)) {
      const key = `${variant}|${state}`;
      if (!placeCoords.has(key)) placeCoords.set(key, coords);
    }
  }

  writeFileSync(path.join(OUT_DIR, 'states.json'), JSON.stringify(STATE_NAMES, null, 0));
  log('wrote data/states.json');

  const season = currentSeason();
  const teams = (await Promise.all(LEAGUES.map((c) => fetchTeams(c, season, zctaByZip, placeCoords)))).flat();

  const located = teams.filter((t) => t.lat !== null);
  const missing = teams.filter((t) => t.lat === null);

  for (const team of located) {
    const city = placeCoords.get(`${normalize(team.venueCity)}|${team.venueState.toLowerCase()}`);
    if (!city) continue;
    const drift = haversineMiles(team.lat, team.lng, city[0], city[1]);
    if (drift > VENUE_CITY_DISAGREEMENT_MI) {
      log(`  venue drift ${Math.round(drift)}mi: ${team.key} ${team.name} — ${team.venue} ${team.venueCity} ${team.venueState}`);
    }
  }

  writeFileSync(path.join(OUT_DIR, 'teams.json'), JSON.stringify(located, null, 0));
  log(`wrote data/teams.json (${located.length} teams, dropped ${missing.length} without coordinates)`);
  for (const t of missing) log(`  no coordinates: ${t.key} ${t.name} — ${t.venue} ${t.venueCity} ${t.venueState}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
