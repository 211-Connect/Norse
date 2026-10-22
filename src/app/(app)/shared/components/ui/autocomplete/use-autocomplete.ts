'use client';

import {
  ChangeEvent,
  CompositionEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useOnPointerDownOutside } from '../../../hooks/use-on-pointer-down-outside';
import { groupAutocompleteOptions } from './group-options';
import { AutocompleteOption, AutocompleteProps } from './types';

/** No option highlighted: the input shows what the user typed. */
const NONE = -1;

/** Delay before focusing the input opens the list. */
const OPEN_ON_FOCUS_DELAY_MS = 100;

type UseAutocompleteParams = Pick<
  AutocompleteProps,
  | 'value'
  | 'defaultOpen'
  | 'blockMode'
  | 'autoSelectIndex'
  | 'autoSelectOnBlurIndex'
  | 'onInputChange'
  | 'onCommit'
  | 'onClear'
  | 'onDecommit'
  | 'onEscape'
> & { options: AutocompleteOption[] };

/**
 * State and interaction rules of the `Autocomplete` combobox.
 *
 * Model:
 * - `typedText` — what the user typed, or the last committed value. Used to
 *   highlight matches, and shown again when no option is highlighted.
 * - `inputText` — what the input displays: `typedText`, or the highlighted
 *   option's value while navigating with the keyboard/mouse (a preview).
 * - `activeIndex` — the highlighted option (`NONE` = none), indexing
 *   `flatOptions`, which is in display order.
 *
 * Nothing reaches the caller while the user is merely navigating. Typing
 * echoes through `onInputChange`; a value is *settled* only by `commit()` →
 * `onCommit` (click, Enter, Tab, Escape on a highlighted option, or
 * blur-autoselect).
 */
export function useAutocomplete({
  options,
  value,
  defaultOpen = false,
  blockMode = false,
  autoSelectIndex,
  autoSelectOnBlurIndex,
  onInputChange,
  onCommit,
  onClear,
  onDecommit,
  onEscape,
}: UseAutocompleteParams) {
  const listboxId = useId();
  const { groups, flatOptions } = useMemo(
    () => groupAutocompleteOptions(options),
    [options],
  );

  const [open, setOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState(NONE);
  const [inputText, setInputText] = useState(value ?? '');
  const [typedText, setTypedText] = useState(value ?? '');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const isComposingRef = useRef(false);
  /** The user is touching/scrolling the list itself: keep it open on blur. */
  const keepOpenOnBlurRef = useRef(false);
  /** Focus is being restored programmatically (after clearing): don't open. */
  const skipNextFocusOpenRef = useRef(false);
  const openOnFocusTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The caller owns the committed value; mirror outside changes into the
  // field (e.g. "Everywhere" after clearing, or "use my location").
  useEffect(() => {
    setInputText(value ?? '');
    setTypedText(value ?? '');
  }, [value]);

  useEffect(() => () => clearTimeout(openOnFocusTimerRef.current), []);

  const selectedOption = useMemo(
    () => flatOptions.find((option) => option.value === value),
    [flatOptions, value],
  );
  const isBlockCommitted =
    blockMode && Boolean(selectedOption) && activeIndex === NONE;

  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const moveCaretToEnd = (text: string) => {
    const input = inputRef.current;
    if (input) {
      input.selectionStart = input.selectionEnd = text.length;
    }
  };

  const closeList = () => {
    setOpen(false);
    setActiveIndex(NONE);
    keepOpenOnBlurRef.current = false;
  };

  /** Highlights an option (or `NONE`) and previews it in the input. */
  const highlight = (index: number, { scroll = true } = {}) => {
    const text = flatOptions[index]?.value ?? typedText;

    setActiveIndex(index);
    setInputText(text);
    moveCaretToEnd(text);

    if (!scroll) {
      return;
    }
    if (index === NONE) {
      listboxRef.current?.scrollTo({ top: 0 });
    } else {
      document
        .getElementById(optionId(index))
        ?.scrollIntoView({ block: 'nearest', inline: 'start' });
    }
  };

  const commit = (text: string, option?: AutocompleteOption) => {
    setInputText(text);
    setTypedText(text);
    onInputChange?.(text);
    onCommit?.(text, option);
  };

  const select = (option: AutocompleteOption) => {
    closeList();
    commit(option.value, option);
  };

  /** Enter/Tab: the highlighted option, else `autoSelectIndex`, else the
   *  text as typed — so a typed value is never silently discarded. */
  const commitFromKeyboard = () => {
    const option =
      flatOptions[activeIndex] ??
      (autoSelectIndex != null ? flatOptions[autoSelectIndex] : undefined);
    commit(option?.value ?? inputText, option);
  };

  const type = (text: string) => {
    setActiveIndex(NONE);
    setTypedText(text);
    setInputText(text);
    onInputChange?.(text);
    setOpen(true);
  };

  /** blockMode: a keypress replaces the whole committed value. */
  const replaceCommittedValue = (text: string) => {
    onDecommit?.(text);
    setActiveIndex(NONE);
    setTypedText(text);
    setInputText(text);
    setOpen(text.length > 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // IME composition uses key events (arrows included) to pick candidates.
    if (
      isComposingRef.current ||
      event.nativeEvent.isComposing ||
      event.key === 'Process'
    ) {
      return;
    }

    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
    if (isBlockCommitted && !hasModifier) {
      if (event.key.length === 1) {
        event.preventDefault();
        replaceCommittedValue(event.key);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        replaceCommittedValue('');
        return;
      }
    }

    const count = flatOptions.length;
    const lastIndex = count - 1;

    switch (event.key) {
      case 'ArrowDown':
        if (!open) {
          setOpen(true);
        } else {
          // Past the last option, wrap back to the typed text.
          highlight(activeIndex >= lastIndex ? NONE : activeIndex + 1);
        }
        return;

      case 'ArrowUp':
        if (open) {
          event.preventDefault();
          // Above the typed text, wrap to the last option.
          highlight(activeIndex === NONE ? lastIndex : activeIndex - 1);
        }
        return;

      case 'ArrowLeft':
      case 'ArrowRight':
        // Editing resumes from the typed text.
        if (activeIndex !== NONE) {
          highlight(NONE);
        }
        return;

      case 'Home':
      case 'End':
        if (open) {
          event.preventDefault();
          highlight(count === 0 ? NONE : event.key === 'Home' ? 0 : lastIndex);
        }
        return;

      case 'Escape': {
        if (!open) {
          return;
        }
        const option = flatOptions[activeIndex];
        closeList();
        if (option) {
          commit(option.value, option);
        } else {
          onEscape?.();
        }
        return;
      }

      case 'Tab':
        // Not prevented: focus still moves on (e.g. to the clear button).
        if (open) {
          closeList();
          commitFromKeyboard();
        }
        return;

      case 'Enter': {
        if (!open) {
          return; // The browser submits the form natively.
        }
        event.preventDefault();
        closeList();
        commitFromKeyboard();

        // Submit after the commit's state updates have rendered.
        const form = event.currentTarget.closest('form');
        if (form) {
          setTimeout(() => form.requestSubmit(), 0);
        }
        return;
      }
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;

    // Mid-composition text is shown but not searched for yet.
    if (
      isComposingRef.current ||
      (event.nativeEvent as InputEvent).isComposing
    ) {
      setInputText(text);
      return;
    }

    type(text);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    type(event.currentTarget.value);
  };

  const handleClick = () => {
    if (!open) {
      inputRef.current?.select();
    }
    setOpen(true);
  };

  const handleFocus = () => {
    keepOpenOnBlurRef.current = false;

    if (skipNextFocusOpenRef.current) {
      skipNextFocusOpenRef.current = false;
      return;
    }

    clearTimeout(openOnFocusTimerRef.current);
    openOnFocusTimerRef.current = setTimeout(
      () => setOpen(true),
      OPEN_ON_FOCUS_DELAY_MS,
    );
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    clearTimeout(openOnFocusTimerRef.current);

    const nextFocus = event.relatedTarget as Node | null;
    const isInteractingWithList =
      keepOpenOnBlurRef.current ||
      Boolean(nextFocus && listboxRef.current?.contains(nextFocus));

    if (
      autoSelectOnBlurIndex != null &&
      !selectedOption &&
      !isInteractingWithList
    ) {
      const option = flatOptions[autoSelectOnBlurIndex];
      if (option) {
        select(option);
      }
    }

    if (!isInteractingWithList && nextFocus !== clearButtonRef.current) {
      closeList();
    }
  };

  const handleClear = (event?: MouseEvent) => {
    event?.preventDefault();
    setActiveIndex(NONE);

    if (onClear) {
      onClear();
    } else {
      setInputText('');
      onInputChange?.('');
    }

    setTypedText('');
    setOpen(false);

    // Return focus to the input without re-opening stale suggestions.
    if (document.activeElement !== inputRef.current) {
      skipNextFocusOpenRef.current = true;
      inputRef.current?.focus();
    }
  };

  /** Pressing the list outside an option (scrollbar, group header, touch
   *  scrolling): drop the input focus — hides the mobile keyboard — while
   *  keeping the list open. */
  const handleListPointerDown = () => {
    keepOpenOnBlurRef.current = true;
    inputRef.current?.blur();
  };

  const handleOptionMouseDown = (
    event: MouseEvent,
    option: AutocompleteOption,
  ) => {
    // Keeps focus in the input and stops the list-level handler above.
    event.preventDefault();
    event.stopPropagation();
    select(option);
  };

  // `mousemove` rather than `mouseenter`: options scrolling under a resting
  // pointer during keyboard navigation must not steal the highlight.
  const handleOptionMouseMove = (index: number) => {
    if (index !== activeIndex) {
      highlight(index, { scroll: false });
    }
  };

  const handleListMouseLeave = () => {
    if (activeIndex !== NONE) {
      highlight(NONE, { scroll: false });
    }
  };

  const handlePointerDownOutside = useCallback((event: PointerEvent) => {
    if (listboxRef.current?.contains(event.target as Node)) {
      return;
    }
    setOpen(false);
    setActiveIndex(NONE);
    keepOpenOnBlurRef.current = false;
    inputRef.current?.blur();
  }, []);

  useOnPointerDownOutside(wrapperRef, handlePointerDownOutside);

  return {
    open,
    activeIndex,
    inputText,
    typedText,
    groups,
    optionCount: flatOptions.length,
    listboxId,
    optionId,
    refs: { wrapperRef, inputRef, listboxRef, clearButtonRef },
    inputHandlers: {
      onKeyDown: handleKeyDown,
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      onClick: handleClick,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    listHandlers: {
      onListPointerDown: handleListPointerDown,
      onListMouseLeave: handleListMouseLeave,
      onOptionMouseDown: handleOptionMouseDown,
      onOptionMouseMove: handleOptionMouseMove,
    },
    clear: handleClear,
  };
}
