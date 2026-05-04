import { NextRequest, NextResponse } from 'next/server';
import { lookupCity } from '@/lib/location-teams';
import { fetchRecentGames } from '@/lib/espn-client';
import { selectTheGame } from '@/lib/game-selector';
import type { ApiResponse, TierId } from '@/lib/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  let body: { city?: string; tierOrder?: TierId[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'city_not_found', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const rawCity = (body.city ?? '').trim();
  if (!rawCity) {
    return NextResponse.json(
      { success: false, error: 'city_not_found', message: 'Please enter a city name.' },
      { status: 400 }
    );
  }

  const cityMapping = lookupCity(rawCity);
  if (!cityMapping) {
    return NextResponse.json(
      {
        success: false,
        error: 'city_not_found',
        message: `We don't recognize "${rawCity}". Try a major US city like Boston, Chicago, or Los Angeles.`,
      },
      { status: 404 }
    );
  }

  const localTeamIds = new Set(cityMapping.teams.map((t) => `${t.league}:${t.espnId}`));

  let allGames;
  try {
    allGames = await fetchRecentGames(3);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'api_error',
        message: 'Could not reach ESPN right now. Please try again in a moment.',
      },
      { status: 503 }
    );
  }

  const result = selectTheGame(allGames, localTeamIds, body.tierOrder);

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error: 'no_recent_games',
        message: `No games found for ${cityMapping.canonicalName} in the last 3 days. Check back on game day!`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    result,
    city: cityMapping.canonicalName,
  });
}
