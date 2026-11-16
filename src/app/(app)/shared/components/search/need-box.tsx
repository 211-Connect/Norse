'use client';

import { ArrowUp, Loader2 } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

import { useSearchSuggestions } from '../../hooks/api/use-search-suggestions';
import { useAppConfig } from '../../hooks/use-app-config';
import { useDebounce } from '../../hooks/use-debounce';
import { SEARCH_DEBOUNCE_DELAY } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { pickNeedSuggestions, SUGGESTION_MAX_WORDS } from './need-suggestions';

function useNeedSuggestions(text: string): string[] {
  const appConfig = useAppConfig();
  const debounced = useDebounce(text, SEARCH_DEBOUNCE_DELAY);
  // The API is asked only for a short phrase, so a sentence never makes a request.
  const asked =
    debounced.trim().split(/\s+/).length <= SUGGESTION_MAX_WORDS
      ? debounced
      : '';
  const { taxonomies } = useSearchSuggestions(asked);
  const local = useMemo(
    () => [
      ...appConfig.suggestions.map((option) => option.value),
      ...appConfig.topics.list.flatMap((topic) =>
        topic.subtopics.map((subtopic) => subtopic.name),
      ),
    ],
    [appConfig.suggestions, appConfig.topics.list],
  );
  return pickNeedSuggestions(
    text,
    local,
    taxonomies.map((taxonomy) => taxonomy.name),
  );
}

/**
 * The need box with its suggestions, one component for the home popup and the landing page.
 * A suggestion only fills the box. The person can change it, then sends it. The parent owns the
 * `<form>`: Enter and the arrow button submit it.
 */
export function NeedBox({
  inputId,
  value,
  onChange,
  rows = 4,
  placeholder,
  autoFocus = false,
  disabled = false,
  busy = false,
  describedBy,
  inputClassName,
  buttonClassName,
  testId,
  submitTestId,
}: {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder: string;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Shows a spinner in the submit button while the search loads. */
  busy?: boolean;
  describedBy?: string;
  inputClassName?: string;
  buttonClassName?: string;
  testId?: string;
  submitTestId?: string;
}): ReactNode {
  const matches = useNeedSuggestions(value);

  return (
    <>
      <div className="relative">
        <textarea
          id={inputId}
          autoFocus={autoFocus}
          rows={rows}
          value={value}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          className={cn(
            'border-control-border focus-visible:ring-primary focus:border-primary block w-full resize-none rounded-lg border bg-white p-3 pr-14 text-base shadow-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:outline-none',
            inputClassName,
          )}
          data-testid={testId}
        />
        <button
          type="submit"
          aria-label="Search"
          disabled={disabled}
          className={cn(
            "bg-primary text-primary-foreground absolute right-3 bottom-3 flex size-9 cursor-pointer items-center justify-center rounded-lg after:absolute after:-inset-1 after:content-[''] disabled:opacity-60",
            buttonClassName,
          )}
          data-testid={submitTestId}
        >
          {busy ? (
            <Loader2
              className="size-5 motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : (
            <ArrowUp className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="sr-only" role="status">
        {matches.length > 0
          ? `${matches.length} suggestions below the search box.`
          : ''}
      </p>
      {matches.length > 0 && (
        <ul
          aria-label="Suggestions"
          className="flex flex-col"
          data-testid="search-need-suggestions"
        >
          {matches.map((match) => (
            <li key={match}>
              <button
                type="button"
                className="text-primary hover:bg-primary/5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm"
                onClick={() => {
                  onChange(match);
                  requestAnimationFrame(() => {
                    const box = document.getElementById(inputId);
                    if (!(box instanceof HTMLTextAreaElement)) return;
                    box.focus();
                    box.setSelectionRange(match.length, match.length);
                  });
                }}
              >
                {match}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
