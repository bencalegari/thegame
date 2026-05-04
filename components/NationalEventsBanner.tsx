'use client';

import { useEffect, useState } from 'react';
import type { NationalEvent } from '@/lib/national-events';

function EventChip({ event }: { event: NationalEvent }) {
  const isLive = event.isLive;
  const isJustFinished = event.statusLabel === 'Just Finished';

  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-sm">
      <span className="text-lg leading-none">{event.sportIcon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-tight whitespace-nowrap">{event.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              Live
            </span>
          ) : isJustFinished ? (
            <span className="text-xs font-medium text-white/40">Just Finished</span>
          ) : (
            <span className="text-xs font-medium text-white/40">{event.statusLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NationalEventsBanner() {
  const [events, setEvents] = useState<NationalEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/national-events')
      .then((r) => r.json())
      .then((data: NationalEvent[]) => {
        setEvents(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || events.length === 0) return null;

  return (
    <div className="w-full max-w-md">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/30">
        Happening Now
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {events.map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
