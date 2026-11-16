'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { NeedBox } from '@/app/(app)/shared/components/search/need-box';
import {
  GuideShell,
  SearchGuideFromUrl,
} from '@/app/(app)/shared/components/search/search-guide';
import { SEARCH_INPUT_ID } from '@/app/(app)/shared/lib/constants';

import {
  useV2Navigate,
  useV2Prefetch,
  useV2Url,
} from '../v2/use-v2-search';
import { EmergencyLine } from './emergency-line';

/**
 * Prototype: the landing page, before the results page (Lucas, 2026-11-13). The person says what
 * they need, and the guide asks up to 3 questions, one at a time, right here. Then the results
 * page opens with the answers in the URL. The always-on 911 and 988 chips sit directly above the
 * search box, as on the results page, and do not depend on the search call.
 */
export function SearchLanding() {
  const { query } = useV2Url();
  const { write, isPending: isWriting } = useV2Navigate();
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
    const changes = {
      query: next,
      query_label: null,
      other: null,
      asked: null,
      refine: null,
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

  return (
    <GuideShell
      dataStep="landing"
      focusId={query ? undefined : SEARCH_INPUT_ID}
      onClose={() => router.push('/')}
      onEscape={onEscape}
    >
      <div className="flex flex-col gap-4 pt-6" data-testid="landing-popup">
        <div>
          <EmergencyLine />
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
            <label htmlFor={SEARCH_INPUT_ID} className="text-2xl font-semibold">
              What do you need help with?
            </label>
            <NeedBox
              inputId={SEARCH_INPUT_ID}
              value={text}
              rows={3}
              autoFocus={!query}
              disabled={isPending}
              busy={isPending}
              placeholder="For example: I need help with rent."
              describedBy={emptyError ? 'landing-empty-error' : undefined}
              onChange={(value) => {
                setText(value);
                setEmptyError(false);
              }}
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
  );
}
