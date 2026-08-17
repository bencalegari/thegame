import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces, toPlaceSummary } from '@/lib/places';
import type { PlaceSummary } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse<{ places: PlaceSummary[] }>> {
  const query = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 40).trim();
  const requestedLimit = parseInt(req.nextUrl.searchParams.get('limit') ?? '8', 10);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 8, 1), 10);

  if (query.length < 2) {
    return NextResponse.json({ places: [] });
  }

  return NextResponse.json(
    { places: searchPlaces(query, limit).map(toPlaceSummary) },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
  );
}
