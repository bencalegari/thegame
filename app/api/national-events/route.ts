import { NextResponse } from 'next/server';
import { fetchNationalEvents } from '@/lib/national-events';
import type { NationalEvent } from '@/lib/national-events';

export async function GET(): Promise<NextResponse<NationalEvent[]>> {
  const events = await fetchNationalEvents();
  return NextResponse.json(events);
}
