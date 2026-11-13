'use client';

import { useAtom } from 'jotai';
import { List, Map as MapIcon } from 'lucide-react';
import { useRef } from 'react';

import { cn } from '@/app/(app)/shared/lib/utils';
import { resultsViewAtom } from '@/app/(app)/shared/store/results';

import { useSearchResults } from '../context/search-results-context';

const VIEWS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'map', label: 'Map', Icon: MapIcon },
] as const;

/** Prototype: a phone shows the list or the map. Back on the list, the person keeps their place. */
export function ResultsViewToggle() {
  const [view, setView] = useAtom(resultsViewAtom);
  const { results } = useSearchResults();
  const listScroll = useRef(0);

  if (results.length === 0) return null;

  const choose = (next: typeof view) => {
    if (next === view) return;
    if (next === 'map') listScroll.current = window.scrollY;
    setView(next);
    if (next === 'list') {
      requestAnimationFrame(() => window.scrollTo(0, listScroll.current));
    }
  };

  return (
    <>
      {/* One bottom bar on a phone: Quick exit sits on its left, this List and Map on its right. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[calc(max(1rem,env(safe-area-inset-bottom))+3.9rem)] border-t bg-white md:hidden print:hidden"
        data-testid="phone-bottom-bar"
      />
      <div
        role="group"
        aria-label="Show results as"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex rounded-lg border bg-white p-0.5 shadow-lg md:hidden print:hidden"
        data-testid="results-view-toggle"
      >
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-semibold',
              view === id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground',
            )}
            onClick={() => choose(id)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
