import { NextRequest, NextResponse } from 'next/server';
import { getPlaceById, resolvePlace, toPlaceSummary } from '@/lib/places';
import { teamDistances } from '@/lib/teams';
import { fetchRecentGames, EspnUnreachableError } from '@/lib/espn-client';
import { selectTheGame } from '@/lib/game-selector';
import { keepRelevant, relevantLeagues, relevantTeamKeys } from '@/lib/relevance';
import type { ApiResponse, TierId } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  let body: { placeId?: string; city?: string; tierOrder?: TierId[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'city_not_found', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const rawCity = (body.city ?? '').trim();
  const place = body.placeId ? getPlaceById(body.placeId) : null;

  if (!place && !rawCity) {
    return NextResponse.json(
      { success: false, error: 'city_not_found', message: 'Please enter a city name.' },
      { status: 400 }
    );
  }

  let resolved = place;
  if (!resolved) {
    const resolution = resolvePlace(rawCity);
    if (resolution.kind === 'ambiguous') {
      return NextResponse.json(
        {
          success: false,
          error: 'ambiguous_city',
          message: `There is more than one ${resolution.candidates[0].name}. Which one did you mean?`,
          candidates: resolution.candidates.map(toPlaceSummary),
        },
        { status: 409 }
      );
    }
    if (resolution.kind === 'none') {
      return NextResponse.json(
        {
          success: false,
          error: 'city_not_found',
          message: `We couldn't find a US city called "${rawCity}". Try adding the state, like "Springfield, MO".`,
        },
        { status: 404 }
      );
    }
    resolved = resolution.place;
  }

  const distances = teamDistances(resolved);
  const relevantKeys = relevantTeamKeys(resolved, distances);
  const leagues = relevantLeagues(resolved, new Date().getMonth() + 1);

  let allGames;
  try {
    allGames = await fetchRecentGames({ leagues, keep: keepRelevant(relevantKeys) });
  } catch (err) {
    const detail = err instanceof EspnUnreachableError ? err.detail : String(err);
    console.error('[api/game] ESPN fetch failed:', detail);
    return NextResponse.json(
      {
        success: false,
        error: 'api_error',
        message: `Could not reach ESPN from the server (${detail}). Check outbound network access for this container.`,
      },
      { status: 503 }
    );
  }

  const result = selectTheGame(allGames, {
    place: resolved,
    teamDistances: distances,
    tierOrder: body.tierOrder,
  });

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error: 'no_recent_games',
        message: `No finished games anywhere near ${resolved.label} in the last few days. Check back on game day!`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, result, place: toPlaceSummary(resolved) });
}
