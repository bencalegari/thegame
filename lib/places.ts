import placesRaw from '@/data/places.json';
import extraRaw from '@/data/places-extra.json';
import aliasesRaw from '@/data/aliases.json';
import statesRaw from '@/data/states.json';
import type { Place, PlaceSummary } from './types';

type PlaceRow = [string, string, number, number, number, string];

interface ExtraPlace {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  population: number;
  aliases?: string[];
}

export type PlaceResolution =
  | { kind: 'exact'; place: Place }
  | { kind: 'ambiguous'; query: string; candidates: Place[] }
  | { kind: 'none'; query: string };

const STATE_NAMES = statesRaw as Record<string, string>;

const STATE_BY_NAME = new Map(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [normalize(name), abbr])
);

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameKeys(name: string): string[] {
  const keys = new Set([normalize(name)]);
  const head = name.split(/[-/]/)[0].trim();
  if (head && head !== name) keys.add(normalize(head));
  if (/\scity$/i.test(name)) keys.add(normalize(name.replace(/\scity$/i, '')));
  if (/^saint\s/i.test(name)) keys.add(normalize(name.replace(/^saint\s/i, 'st ')));
  if (/^st\.?\s/i.test(name)) keys.add(normalize(name.replace(/^st\.?\s/i, 'saint ')));
  return [...keys].filter(Boolean);
}

function toPlace(name: string, state: string, lat: number, lng: number, population: number, id: string, country: 'US' | 'CA'): Place {
  return { id, name, state, country, lat, lng, population, label: `${name}, ${state}` };
}

const PLACES: Place[] = [
  ...(placesRaw as PlaceRow[]).map(([name, state, lat, lng, pop, geoid]) =>
    toPlace(name, state, lat, lng, pop, geoid, 'US')
  ),
  ...(extraRaw as ExtraPlace[]).map((e) =>
    toPlace(e.name, e.state, e.lat, e.lng, e.population, e.id, e.country === 'CA' ? 'CA' : 'US')
  ),
].sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));

const BY_ID = new Map<string, Place>();
const BY_NAME = new Map<string, Place[]>();
const BY_NAME_STATE = new Map<string, Place>();

for (const place of PLACES) {
  BY_ID.set(place.id, place);
  for (const key of nameKeys(place.name)) {
    const list = BY_NAME.get(key);
    if (list) list.push(place);
    else BY_NAME.set(key, [place]);

    const stateKey = `${key}|${place.state.toLowerCase()}`;
    if (!BY_NAME_STATE.has(stateKey)) BY_NAME_STATE.set(stateKey, place);
  }
}

for (const extra of extraRaw as ExtraPlace[]) {
  const place = BY_ID.get(extra.id);
  if (!place) continue;
  for (const alias of extra.aliases ?? []) {
    const key = normalize(alias);
    const list = BY_NAME.get(key);
    if (list) list.push(place);
    else BY_NAME.set(key, [place]);
    BY_NAME_STATE.set(`${key}|${place.state.toLowerCase()}`, place);
  }
}

const ALIASES = new Map<string, Place>();
for (const [alias, target] of Object.entries(aliasesRaw as Record<string, string>)) {
  const [name, state] = target.split('|');
  const place = BY_NAME_STATE.get(`${normalize(name)}|${state.toLowerCase()}`);
  if (place) ALIASES.set(normalize(alias), place);
}

const SEARCH_KEYS: string[][] = PLACES.map((p) => nameKeys(p.name));

export function normalizePlaceQuery(input: string): { name: string; state: string | null } {
  const cleaned = normalize(input);
  if (!cleaned) return { name: '', state: null };

  const commaIndex = input.indexOf(',');
  if (commaIndex > 0) {
    const namePart = normalize(input.slice(0, commaIndex));
    const statePart = normalize(input.slice(commaIndex + 1));
    const state = resolveStateToken(statePart);
    if (state && namePart) return { name: namePart, state };
  }

  const words = cleaned.split(' ');
  for (let take = Math.min(3, words.length - 1); take >= 1; take--) {
    const tail = words.slice(words.length - take).join(' ');
    const state = resolveStateToken(tail);
    if (state) {
      return { name: words.slice(0, words.length - take).join(' '), state };
    }
  }

  return { name: cleaned, state: null };
}

function resolveStateToken(token: string): string | null {
  if (!token) return null;
  const upper = token.toUpperCase();
  if (token.length === 2 && STATE_NAMES[upper]) return upper;
  return STATE_BY_NAME.get(token) ?? null;
}

export function getPlaceById(id: string): Place | null {
  return BY_ID.get(id) ?? null;
}

export function resolvePlace(input: string): PlaceResolution {
  const query = input.trim();
  if (!query) return { kind: 'none', query };

  const { name, state } = normalizePlaceQuery(query);

  if (state && name) {
    const exact = BY_NAME_STATE.get(`${name}|${state.toLowerCase()}`);
    if (exact) return { kind: 'exact', place: exact };
  }

  const alias = ALIASES.get(normalize(query)) ?? (state ? null : ALIASES.get(name));
  if (alias) return { kind: 'exact', place: alias };

  const matches = (BY_NAME.get(name) ?? []).filter((p) => !state || p.state === state);
  if (matches.length === 0) return { kind: 'none', query };

  const ranked = [...matches].sort((a, b) => b.population - a.population);
  const [top, second] = ranked;
  if (!second || top.population >= 250_000 || top.population >= 3 * second.population) {
    return { kind: 'exact', place: top };
  }

  return { kind: 'ambiguous', query, candidates: ranked.slice(0, 6) };
}

export function searchPlaces(input: string, limit = 8): Place[] {
  const { name, state } = normalizePlaceQuery(input);
  const rawQuery = normalize(input);
  if (!name && !rawQuery) return [];

  const prefix = name || rawQuery;
  const results: Place[] = [];
  const seen = new Set<string>();

  const aliasHit = ALIASES.get(rawQuery);
  if (aliasHit) {
    results.push(aliasHit);
    seen.add(aliasHit.id);
  }

  for (let i = 0; i < PLACES.length && results.length < limit; i++) {
    const place = PLACES[i];
    if (seen.has(place.id)) continue;
    if (state && place.state !== state) continue;
    if (!SEARCH_KEYS[i].some((key) => key.startsWith(prefix))) continue;
    results.push(place);
    seen.add(place.id);
  }

  if (results.length < limit && prefix.length >= 3) {
    for (let i = 0; i < PLACES.length && results.length < limit; i++) {
      const place = PLACES[i];
      if (seen.has(place.id)) continue;
      if (state && place.state !== state) continue;
      if (!SEARCH_KEYS[i].some((key) => key.includes(` ${prefix}`))) continue;
      results.push(place);
      seen.add(place.id);
    }
  }

  return results;
}

export function toPlaceSummary(place: Place): PlaceSummary {
  return {
    id: place.id,
    label: place.label,
    name: place.name,
    state: place.state,
    population: place.population,
  };
}
