import { ComponentType, ReactNode } from 'react';

import { InputProps } from '../input';

export type AutocompleteOption = {
  value: string;
  group?: string;
  Icon?: ComponentType<{ className?: string }>;
  badge?: string;
  query?: string;
  queryType?: string;
  organizationId?: string;
  href?: string;
  target?: '_self' | '_blank';
};

/** An option plus its position in display (= keyboard navigation) order. */
export type IndexedAutocompleteOption = AutocompleteOption & { index: number };

export type AutocompleteOptionGroup = {
  /** `undefined` for options passed without a `group`. */
  name: string | undefined;
  options: IndexedAutocompleteOption[];
};

export type AutocompleteProps = {
  readerLabel: ReactNode;
  Icon: ComponentType<{ className?: string }>;
  inputProps?: InputProps;
  options?: AutocompleteOption[];
  className?: string;
  /** Fires on every keystroke/composition-end (and, alongside commits, with
   *  the settled value too) — a live-text echo. Never gates side effects on
   *  its own; see `onCommit` for that. */
  onInputChange?: (value: string) => void;
  /** Fires only when a value is explicitly settled: click, Enter, Tab,
   *  Escape with an option highlighted, or blur-autoselect. Never fires from
   *  raw typing — this is the signal to act on (persist, geocode, etc). */
  onCommit?: (value: string, option?: AutocompleteOption) => void;
  /** Replaces the default clear behavior (empty the field). */
  onClear?: () => void;
  value?: string;
  /** Option committed by Enter/Tab when nothing is highlighted. */
  autoSelectIndex?: number;
  /** Option committed when the field loses focus while its value doesn't
   *  match any option. */
  autoSelectOnBlurIndex?: number;
  defaultOpen?: boolean;
  clearButtonLabel?: string;
  /** Anchor the list's position (and width) to a different element than the
   *  input, by DOM id — e.g. a wrapper spanning several combined inputs, so
   *  the list opens below the whole group. */
  positionBelowElementId?: string;
  /** data-testid applied to the outer wrapper so e2e tests can scope the
   *  input, its clear button, and its listbox together. */
  wrapperTestId?: string;
  /** Treat a committed (selected) value as an indivisible block. Any printable
   *  keypress replaces the whole block and starts a fresh search. */
  blockMode?: boolean;
  /** Called when the block is burst-cleared by a keypress. Receives the
   *  character that triggered the clear, or '' for Backspace/Delete. */
  onDecommit?: (nextValue: string) => void;
  /** Called when Escape is pressed while the user is typing (no option
   *  highlighted). Use to reset the field to a known-good state. */
  onEscape?: () => void;
  /** More options are on their way (debounce or request in flight): shows a
   *  spinner in the field and a "loading" row in an otherwise empty list. */
  loading?: boolean;
  /** Extra classes for the list, e.g. a shadow where it floats over other
   *  content such as a dialog. */
  listboxClassName?: string;
};
