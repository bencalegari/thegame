'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { PlaceSummary } from '@/lib/types';

export interface CitySelection {
  placeId?: string;
  text: string;
  label: string;
}

interface Props {
  onSearch: (selection: CitySelection) => void;
  loading: boolean;
}

export default function CitySearch({ onSearch, loading }: Props) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSummary[]>([]);
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const suppressRef = useRef(false);

  useEffect(() => {
    const query = input.trim();
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    if (query.length < 2) {
      setSuggestions([]);
      setHighlighted(-1);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data: { places: PlaceSummary[] } = await res.json();
        setSuggestions(data.places ?? []);
        setHighlighted(-1);
      } catch {
        setHighlighted(-1);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function submitPlace(place: PlaceSummary) {
    if (loading) return;
    suppressRef.current = true;
    setSuggestions([]);
    setHighlighted(-1);
    setInput(place.label);
    onSearch({ placeId: place.id, text: place.label, label: place.label });
  }

  function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    suppressRef.current = true;
    setSuggestions([]);
    setHighlighted(-1);
    onSearch({ text: trimmed, label: trimmed });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted >= 0 && suggestions[highlighted]) submitPlace(suggestions[highlighted]);
      else submitText(input);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setHighlighted(-1);
    }
  }

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Enter any US city..."
            aria-label="City name"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            disabled={loading}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
          />
          {showDropdown && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-white/20 bg-gray-900/95 backdrop-blur-sm shadow-xl"
            >
              {suggestions.map((place, i) => (
                <li
                  key={place.id}
                  role="option"
                  aria-selected={i === highlighted}
                  onMouseDown={() => submitPlace(place)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                    i === highlighted ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  {place.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() =>
            highlighted >= 0 && suggestions[highlighted]
              ? submitPlace(suggestions[highlighted])
              : submitText(input)
          }
          disabled={loading || !input.trim()}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-gray-900 transition-all hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Finding...</span>
            </span>
          ) : (
            'Find The Game'
          )}
        </button>
      </div>
    </div>
  );
}
