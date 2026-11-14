'use client';

import { ArrowUp, Pencil } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { SearchGuideFromUrl } from '@/app/(app)/shared/components/search/search-guide';
import { SEARCH_INPUT_ID } from '@/app/(app)/shared/lib/constants';

import { useV2Navigate, useV2Url } from '../v2/use-v2-search';
import { EmergencyLine } from './emergency-line';

/**
 * Prototype: the landing page, before the results page (Lucas, 2026-11-13). The person says what
 * they need, and the guide asks up to 3 questions, one at a time, right here. Then the results
 * page opens with the answers in the URL. The always-on 911 and 988 chips sit directly above the
 * search box, as on the results page, and do not depend on the search call.
 */
export function SearchLanding() {
  const { query } = useV2Url();
  const { write, isPending } = useV2Navigate();
  const [text, setText] = useState(query);
  const [emptyError, setEmptyError] = useState(false);
  // Once the questions start, the box shrinks to one line; Edit opens it again.
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const compact = Boolean(query) && !editing;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Back and Forward change the URL, so the box follows it.
  useEffect(() => setText(query), [query]);

  const closeEdit = () => {
    setEditing(false);
    // Focus goes back to the Edit button once it is rendered.
    setTimeout(() => document.getElementById('landing-edit')?.focus(), 0);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = text.trim();
    if (!next) return setEmptyError(true);
    // Same text: the answers stay, the questions come back.
    if (next === query) return closeEdit();
    setEditing(false);
    // A new search starts the questions again: `asked` goes, and a new text drops the old answers.
    write({
      query: next,
      query_label: null,
      other: null,
      asked: null,
      refine: null,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-28 md:py-10">
      <h1 className="text-3xl font-semibold">Find help</h1>
      <div>
        <EmergencyLine />
        {compact && (
          <div
            className="border-control-border flex items-center gap-2 rounded-lg border bg-white pl-4 shadow-sm"
            data-testid="landing-compact"
          >
            <p className="min-w-0 flex-1 truncate py-3 text-base">
              <span className="sr-only">Your search: </span>
              {query}
            </p>
            <button
              type="button"
              id="landing-edit"
              aria-label="Edit your search"
              onClick={() => setEditing(true)}
              className="text-primary flex min-h-11 min-w-11 cursor-pointer items-center gap-1 px-3 text-sm font-semibold"
              data-testid="landing-edit"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </button>
          </div>
        )}
        <form
          className="relative w-full"
          hidden={compact}
          onSubmit={submit}
          aria-busy={isPending}
          data-testid="landing-form"
        >
          <label
            htmlFor={SEARCH_INPUT_ID}
            className="mb-2 block text-xl font-semibold"
          >
            What do you need help with?
          </label>
          <div className="relative">
            <textarea
              id={SEARCH_INPUT_ID}
              ref={inputRef}
              rows={2}
              value={text}
              autoFocus={!query}
              placeholder="For example: I need help with rent."
              aria-describedby={emptyError ? 'landing-empty-error' : undefined}
              onChange={(event) => {
                setText(event.target.value);
                setEmptyError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && query && editing) {
                  setText(query);
                  return closeEdit();
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              className="border-control-border focus-visible:ring-primary focus:border-primary block min-h-16 w-full resize-none rounded-lg border bg-white py-3 pr-14 pl-4 text-base shadow-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:outline-none"
              data-testid="landing-input"
            />
            <button
              type="submit"
              aria-label="Search"
              disabled={isPending}
              className="bg-primary text-primary-foreground absolute right-2.5 bottom-2.5 flex size-9 cursor-pointer items-center justify-center rounded-lg after:absolute after:-inset-1 after:content-[''] disabled:opacity-60"
              data-testid="landing-submit"
            >
              <ArrowUp className="size-5" aria-hidden="true" />
            </button>
          </div>
          {emptyError && (
            <p
              id="landing-empty-error"
              role="alert"
              className="mt-2 text-sm font-semibold text-red-700"
            >
              Tell us what you need help with first.
            </p>
          )}
        </form>
      </div>
      {query ? (
        !editing && <SearchGuideFromUrl placement="page" />
      ) : (
        <p className="text-muted-foreground text-sm">
          We ask up to 3 short questions, so your results fit. You can skip any
          of them.
        </p>
      )}
    </div>
  );
}
