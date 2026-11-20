'use client';

import { ArrowUp, Loader2 } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBreakpoint } from '../../hooks/use-breakpoint';
import { cn } from '../../lib/utils';
import { AutocompleteOption } from '../ui/autocomplete';
import { AutocompleteListbox } from '../ui/autocomplete/autocomplete-listbox';
import { groupAutocompleteOptions } from '../ui/autocomplete/group-options';
import { SUGGESTION_MAX_WORDS } from './need-suggestions';
import { useSearchBarOptions } from './search-bar';

/** Desktop shows the v1 groups; a phone shows one flat list (Lucas, 2026-11-20). */
const GROUPS_FROM_PX = 768;

/**
 * The need box with its suggestions, one component for the home popup and the landing page. The
 * suggestions are the v1 search bar's own options (`useSearchBarOptions`: groups, organization rows,
 * badges) shown in the v1 list (`AutocompleteListbox`). A click on one fills the box and calls
 * `onPick` (the page opens the results with no questions). The parent owns the `<form>`: Enter
 * and the arrow button submit it.
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
  onPick,
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
  /** A suggestion was clicked or chosen with Enter. Without it, the pick only fills the box. */
  onPick?: (option: AutocompleteOption) => void;
}): ReactNode {
  const { t } = useTranslation('common');
  const grouped = useBreakpoint(GROUPS_FROM_PX);
  const { options, isLoading } = useSearchBarOptions(value, {
    maxWords: SUGGESTION_MAX_WORDS,
  });
  const shown = useMemo(() => {
    const typed = value.trim().toLowerCase();
    // Nothing typed: no list. The exact text again is not a suggestion.
    const list = typed
      ? options.filter((option) => option.value.toLowerCase() !== typed)
      : [];
    return grouped
      ? list
      : list.map((option) => ({ ...option, group: undefined }));
  }, [grouped, options, value]);
  const { groups, flatOptions } = useMemo(
    () => groupAutocompleteOptions(shown),
    [shown],
  );
  const [active, setActive] = useState(-1);
  const activeIndex = active < flatOptions.length ? active : -1;
  const listId = `${inputId}-suggestions`;
  const optionId = (index: number) => `${listId}-option-${index}`;
  const pick = (option: AutocompleteOption) => {
    setActive(-1);
    onChange(option.value);
    onPick?.(option);
  };

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
          role="combobox"
          aria-expanded={flatOptions.length > 0}
          aria-controls={flatOptions.length > 0 ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          onKeyDown={(event) => {
            const count = flatOptions.length;
            if (count > 0 && event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((activeIndex + 1) % count);
            } else if (count > 0 && event.key === 'ArrowUp') {
              event.preventDefault();
              setActive(activeIndex <= 0 ? count - 1 : activeIndex - 1);
            } else if (event.key === 'Escape' && activeIndex >= 0) {
              event.stopPropagation();
              setActive(-1);
            } else if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (activeIndex >= 0) pick(flatOptions[activeIndex]);
              else event.currentTarget.form?.requestSubmit();
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
        {flatOptions.length > 0
          ? `${flatOptions.length} suggestions below the search box.`
          : ''}
      </p>
      {(flatOptions.length > 0 || (isLoading && value.trim())) && (
        <div data-testid="search-need-suggestions">
          <AutocompleteListbox
            id={listId}
            ref={null}
            groups={groups}
            activeIndex={activeIndex}
            highlightText={value}
            optionId={optionId}
            loading={isLoading}
            loadingLabel={t('autocomplete.loading')}
            className="mt-1 max-h-72"
            onListPointerDown={() => undefined}
            onListMouseLeave={() => setActive(-1)}
            onOptionMouseDown={(event, option) => {
              // Mouse down, as in the v1 list, so the box does not blur first.
              event.preventDefault();
              pick(option);
            }}
            onOptionMouseMove={setActive}
          />
        </div>
      )}
    </>
  );
}
