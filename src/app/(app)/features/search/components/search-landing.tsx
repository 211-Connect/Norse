'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { MainSearchLayoutContextProvider } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout-context';
import { NeedBox } from '@/app/(app)/shared/components/search/need-box';
import { needBoxTexts } from '@/app/(app)/shared/components/search/need-texts';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  GuideShell,
  SearchGuideFromUrl,
} from '@/app/(app)/shared/components/search/search-guide';
import { SEARCH_INPUT_ID } from '@/app/(app)/shared/lib/constants';

import { suggestionPickChanges } from '../v2/landing';
import { useV2Navigate, useV2Prefetch, useV2Url } from '../v2/use-v2-search';
import { DEFAULT_HOTLINES, EmergencyLine } from './emergency-line';
import { LandingLocation } from './landing-location';

/**
 * Prototype: the landing page, before the results page (Lucas, 2026-11-13). The person says what
 * they need, and the guide asks up to 3 questions, one at a time, right here. Then the results
 * page opens with the answers in the URL. The always-on 911 and 988 chips sit directly above the
 * search box, as on the results page, and do not depend on the search call.
 */
export function SearchLanding() {
  const { query } = useV2Url();
  const needTexts = needBoxTexts(useAppConfig().search.texts);
  const { write, toResults, isPending: isWriting } = useV2Navigate();
  const prefetch = useV2Prefetch();
  // Lucas 2026-11-16: after Enter nothing moves until the answer is known. The box stays as it is,
  // with a spinner, while the search loads; then the page shows a question or the results.
  const [loading, setLoading] = useState(false);
  const isPending = isWriting || loading;
  const [text, setText] = useState(query);
  const [emptyError, setEmptyError] = useState(false);
  // Once the questions start, the box shrinks to one line; Edit opens it again.
  const [editing, setEditing] = useState(false);
  const router = useRouter();
  const compact = Boolean(query) && !editing;

  useEffect(() => {
    if (editing) document.getElementById(SEARCH_INPUT_ID)?.focus();
  }, [editing]);

  // Back and Forward change the URL, so the box follows it.
  useEffect(() => setText(query), [query]);

  const closeEdit = () => {
    setEditing(false);
    // Focus goes back to the Edit button once it is rendered.
    setTimeout(() => document.getElementById('landing-edit')?.focus(), 0);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = text.trim();
    if (!next) return setEmptyError(true);
    // Same text: the answers stay, the questions come back.
    if (next === query) return closeEdit();
    // A new search starts the questions again: `asked` goes, and a new text drops the old answers.
    // `refine=1` keeps the page on the questions: a plain /find?query= URL shows results (SEO, shared links).
    const changes = {
      query: next,
      query_label: null,
      asked: null,
      refine: '1',
    };
    setLoading(true);
    await prefetch(changes);
    setLoading(false);
    setEditing(false);
    write(changes);
  };

  // Escape in edit mode goes back to the compact bar; otherwise it closes the popup (home page).
  const onEscape = () => {
    if (!(query && editing)) return false;
    setText(query);
    closeEdit();
    return true;
  };

  // The location box (guide location step, LocationSearchBar in the location row) writes the typed and
  // picked place through MainSearchLayoutContext. /find had no provider, so typing a place never
  // geocoded and a pick never saved (David 2026-11-19 'location search looks broken'; live walk 2026-11-20).
  return (
    <MainSearchLayoutContextProvider>
      <GuideShell
        dataStep="landing"
        focusId={query ? undefined : SEARCH_INPUT_ID}
        onClose={() => {
          router.push('/');
          // Keyboard and screen-reader users keep their place (UX pass 2026-11-16): Escape or Close
          // left focus on <body>. Focus the home search box once the home page has rendered it.
          focusWhenReady('/', '[data-testid="search-trigger"]');
        }}
        onEscape={onEscape}
        innerScroll
      >
        <div
          className="flex min-h-0 flex-1 flex-col gap-4"
          data-testid="landing-popup"
        >
          {/* Crisis chips and the search box (or its compact Edit row) and the place row. This block
            never scrolls: the questions below it do (GuideShell innerScroll, guide-scroll). */}
          <div className="relative z-20 shrink-0" data-testid="landing-header">
            <EmergencyLine hotlines={DEFAULT_HOTLINES} />
            {compact && (
              <button
                type="button"
                id="landing-edit"
                aria-label={`Edit your search: ${query}`}
                onClick={() => setEditing(true)}
                className="border-control-border flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-lg border bg-white pl-4 text-left shadow-sm"
                data-testid="landing-compact"
              >
                <span className="min-w-0 flex-1 truncate py-3 text-base">
                  {query}
                </span>
                <span
                  className="text-primary flex min-h-11 items-center gap-1 px-3 text-sm font-semibold"
                  data-testid="landing-edit"
                  aria-hidden="true"
                >
                  <Pencil className="size-4" />
                  Edit
                </span>
              </button>
            )}
            <form
              className="flex flex-col gap-2"
              hidden={compact}
              onSubmit={submit}
              aria-busy={isPending}
              data-testid="landing-form"
            >
              <label
                htmlFor={SEARCH_INPUT_ID}
                className="text-2xl font-semibold"
              >
                {needTexts.title}
              </label>
              <NeedBox
                inputId={SEARCH_INPUT_ID}
                value={text}
                rows={3}
                autoFocus={!query}
                disabled={isPending}
                busy={isPending}
                placeholder={needTexts.placeholder}
                describedBy={emptyError ? 'landing-empty-error' : undefined}
                onChange={(value) => {
                  setText(value);
                  setEmptyError(false);
                }}
                onPick={(option) => toResults(suggestionPickChanges(option))}
                testId="landing-input"
                submitTestId="landing-submit"
              />
              {emptyError && (
                <p
                  id="landing-empty-error"
                  role="alert"
                  className="text-sm font-semibold text-red-700"
                >
                  Tell us what you need help with first.
                </p>
              )}
            </form>
            <LandingLocation />
          </div>
          {query && !editing ? (
            <SearchGuideFromUrl placement="page" />
          ) : (
            // Same line, same place while the search loads, so the card keeps its size.
            <p className="text-muted-foreground text-sm" role="status">
              {isPending
                ? 'Looking at your search…'
                : 'We ask up to 3 short questions, so your results fit. You can skip any of them.'}
            </p>
          )}
        </div>
      </GuideShell>
    </MainSearchLayoutContextProvider>
  );
}

/**
 * Focus the first element matching `selector` once the page at `path` has rendered it. The landing
 * page has its own search box behind the dialog, so the path check keeps focus off the old page.
 * Gives up after about 3 seconds.
 */
function focusWhenReady(path: string, selector: string, triesLeft = 30) {
  const el =
    new URL(document.URL).pathname === path
      ? document.querySelector<HTMLElement>(selector)
      : null;
  if (el) {
    el.focus();
    return;
  }
  if (triesLeft > 0) {
    setTimeout(() => focusWhenReady(path, selector, triesLeft - 1), 100);
  }
}
