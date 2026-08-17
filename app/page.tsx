'use client';

import { useState } from 'react';
import CitySearch, { type CitySelection } from '@/components/CitySearch';
import ResultCard from '@/components/ResultCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import WeightEditor from '@/components/WeightEditor';
import NationalEventsBanner from '@/components/NationalEventsBanner';
import type { ApiResponse, GameResult, PlaceSummary, TierConfig } from '@/lib/types';
import { DEFAULT_TIER_ORDER } from '@/lib/types';

type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'result'; result: GameResult; place: PlaceSummary }
  | {
      status: 'error';
      error: 'city_not_found' | 'ambiguous_city' | 'no_recent_games' | 'api_error';
      message: string;
      candidates: PlaceSummary[];
    };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: 'idle' });
  const [tiers, setTiers] = useState<TierConfig[]>(DEFAULT_TIER_ORDER);

  async function search(body: { placeId?: string; city?: string }) {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, tierOrder: tiers.map((t) => t.id) }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setState({ status: 'result', result: data.result, place: data.place });
      } else {
        setState({
          status: 'error',
          error: data.error,
          message: data.message,
          candidates: data.candidates ?? [],
        });
      }
    } catch {
      setState({
        status: 'error',
        error: 'api_error',
        message: 'Something went wrong. Please try again.',
        candidates: [],
      });
    }
  }

  function handleSearch(selection: CitySelection) {
    search(selection.placeId ? { placeId: selection.placeId } : { city: selection.text });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-start px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-white tracking-tight mb-2">
          The Game
        </h1>
        <p className="text-white/50 text-lg max-w-sm">
          Someone mentioned &ldquo;the game.&rdquo; Based on where you are, here&apos;s what they meant.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <NationalEventsBanner />
        <WeightEditor tiers={tiers} onChange={setTiers} />
        <CitySearch onSearch={handleSearch} loading={state.status === 'loading'} />
      </div>

      <div className="mt-8 w-full flex flex-col items-center">
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'result' && (
          <ResultCard result={state.result} city={state.place.label} />
        )}
        {state.status === 'error' && (
          <>
            <ErrorState error={state.error} message={state.message} />
            {state.candidates.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {state.candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => search({ placeId: candidate.id })}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/20"
                  >
                    {candidate.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {state.status === 'idle' && (
          <p className="text-center text-white/20 text-sm mt-4">
            Enter a city above to find out what everyone&apos;s talking about.
          </p>
        )}
      </div>
    </main>
  );
}
