'use client';

import { useState } from 'react';
import CitySearch from '@/components/CitySearch';
import ResultCard from '@/components/ResultCard';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import WeightEditor from '@/components/WeightEditor';
import NationalEventsBanner from '@/components/NationalEventsBanner';
import type { ApiResponse, GameResult, TierConfig } from '@/lib/types';
import { DEFAULT_TIER_ORDER } from '@/lib/types';

type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'result'; result: GameResult; city: string }
  | { status: 'error'; error: 'city_not_found' | 'no_recent_games' | 'api_error'; message: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: 'idle' });
  const [tiers, setTiers] = useState<TierConfig[]>(DEFAULT_TIER_ORDER);

  async function handleSearch(city: string) {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, tierOrder: tiers.map((t) => t.id) }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setState({ status: 'result', result: data.result, city: data.city });
      } else {
        setState({ status: 'error', error: data.error, message: data.message });
      }
    } catch {
      setState({
        status: 'error',
        error: 'api_error',
        message: 'Something went wrong. Please try again.',
      });
    }
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

      <div className="mt-8 w-full flex justify-center">
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'result' && (
          <ResultCard result={state.result} city={state.city} />
        )}
        {state.status === 'error' && (
          <ErrorState error={state.error} message={state.message} />
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
