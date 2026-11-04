'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChevronDown, Phone, Plus, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { useDismissOutside } from '@/app/(app)/shared/hooks/use-dismiss-outside';
import { queryLabelAtom } from '@/app/(app)/shared/store/search';
import { cn } from '@/app/(app)/shared/lib/utils';

import {
  applyAnswer,
  classifySune,
  decideRefine,
  labelOf,
  lookup,
  matchAddable,
} from '../sune-demo/sune.mjs';

type Answer = {
  label: string;
  add: string[];
  remove?: string[];
  keeps: number;
};
type Question = { id: string; text: string; why: string; answers: Answer[] };
type Decision = {
  kind: 'question' | 'crisis' | 'done';
  level: 'critical' | 'important' | 'helpful';
  total: number;
  question?: Question;
};

/** True from the moment the box is emptied until the next search: tags and refine go with it. */
export const searchClearedAtom = atom(false);
const refineCollapsedAtom = atom(false);

/** The URL holds the search state, so a shared link shows the same tags and results. */
function useSuneSearch() {
  const params = useSearchParams()!;
  // The search that ran, not the box: typing must not reread the page until it is submitted.
  const typedLabel = useAtomValue(queryLabelAtom) ?? '';
  const cleared = useAtomValue(searchClearedAtom);
  const label = cleared
    ? ''
    : (params.get('query_label') ?? params.get('query') ?? typedLabel);
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const stated = params
    .getAll('taxonomy')
    .flatMap((value) => value.split(','))
    .filter(Boolean);
  const codes = useMemo<string[]>(
    () =>
      (stated.length ? stated : (classifySune(label).codes as string[])).filter(
        (code) => code !== 'U-X' && lookup(code),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stated.join(), label],
  );
  const answered = useMemo(
    () => (params.get('refined') ?? '').split(',').filter(Boolean),
    [params],
  );
  const decision = useMemo(
    () => decideRefine(label, codes, answered) as Decision,
    [label, codes, answered],
  );

  const update = (nextCodes: string[], nextAnswered = answered) => {
    const next = new URLSearchParams(params.toString());
    next.delete('taxonomy');
    next.delete('page');
    // U-X is SUNE's "not yet known": it keeps an emptied search from being classified again.
    for (const code of nextCodes.length ? nextCodes : ['U-X']) {
      next.append('taxonomy', code);
    }
    next.set('refined', nextAnswered.join(','));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  return { label, codes, answered, decision, update, isPending };
}

const TAG =
  'bg-card border-primary flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm';
const ADD_PILL =
  'bg-primary/10 text-primary border-primary/50 flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-sm font-medium';

/** Terms a person could not find. A stand-in for a real report to our system. */
export const flaggedAtom = atom<string[]>([]);

/**
 * Prototype: tags stay out of the way until a person says the results look wrong.
 * The button appears after the 3rd result, or at once when there are fewer than 3.
 */
export function SearchResultsHelp() {
  const { label, codes, update } = useSuneSearch();
  const setFlagged = useSetAtom(flaggedAtom);
  const [shown, setShown] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const [thanks, setThanks] = useState('');
  const addBoxRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  // Clicking away hides the box and keeps what was typed.
  useDismissOutside(addBoxRef, adding, () => setAdding(false));

  useEffect(() => {
    setShown(false);
    const check = () => {
      const third = document.querySelectorAll('[data-search-result]')[2]
        ?.firstElementChild;
      if (!third || third.getBoundingClientRect().bottom < 120) setShown(true);
    };
    const settled = setTimeout(check, 1500);
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      clearTimeout(settled);
      window.removeEventListener('scroll', check);
    };
  }, [label]);

  if (!label.trim() || !shown) return null;

  const typed = draft.trim().toLowerCase();
  const matches = matchAddable(typed, codes) as {
    code: string;
    label: string;
  }[];

  const closeAdd = () => {
    setAdding(false);
    setDraft('');
    addButtonRef.current?.focus();
  };
  const addTerm = (code: string) => {
    update([...codes, code]);
    setThanks('');
    closeAdd();
  };
  // A term SUNE lacks never becomes a tag: the person flags it and we look at it.
  const flagMissing = () => {
    const text = draft.trim();
    setFlagged((prev) => [...prev, text]);
    setThanks(`Thank you. We will look at adding “${text}”.`);
    closeAdd();
  };
  const sendNote = () => {
    if (!note.trim()) return;
    setNote('');
    setThanks('Thank you. We use this to fix our mistakes.');
  };

  return (
    <DialogPrimitive.Root modal={false}>
      <DialogPrimitive.Trigger
        className="fixed right-4 bottom-4 z-30 cursor-pointer rounded-lg bg-orange-700 px-4 py-3 text-sm font-semibold text-white shadow-lg print:hidden"
        data-testid="search-results-help"
      >
        Not getting the results you expected?
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="bg-card fixed inset-x-4 bottom-4 z-40 flex max-h-[80dvh] flex-col gap-3 overflow-y-auto rounded-xl border p-4 shadow-xl md:left-auto md:w-96"
          data-testid="search-results-help-panel"
          onEscapeKeyDown={(event) => {
            if (adding) event.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <DialogPrimitive.Title className="text-lg font-semibold">
              What we understood
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex size-8 cursor-pointer items-center justify-center"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="text-muted-foreground text-sm">
            Remove what is not true. Add what we missed.
          </DialogPrimitive.Description>
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="search-situation-tags"
          >
            {codes.map((code: string) => (
              <span key={code} className={TAG}>
                {labelOf(code)}
                <button
                  type="button"
                  aria-label={`Remove ${labelOf(code)}`}
                  className="cursor-pointer"
                  onClick={() => update(codes.filter((item) => item !== code))}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button
              ref={addButtonRef}
              type="button"
              data-dismiss-keep
              className={ADD_PILL}
              onClick={() => setAdding((prev) => !prev)}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          </div>
          {adding && (
            <div className="flex flex-col gap-1" ref={addBoxRef}>
              <input
                autoFocus
                aria-label="Add a need"
                value={draft}
                placeholder="Start typing, then pick one"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    if (matches[0]) addTerm(matches[0].code);
                  }
                  if (event.key === 'Escape') closeAdd();
                }}
                className="bg-card border-primary w-full rounded-lg border px-3 py-2 text-base outline-none focus:outline-none md:text-sm"
              />
              {typed && (
                <ul className="bg-card rounded-lg border">
                  {matches.map((term) => (
                    <li key={term.code}>
                      <button
                        type="button"
                        className="hover:bg-primary/5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm"
                        onClick={() => addTerm(term.code)}
                      >
                        {term.label}
                      </button>
                    </li>
                  ))}
                  <li className={cn(matches.length > 0 && 'border-t')}>
                    <button
                      type="button"
                      className="text-primary hover:bg-primary/5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium"
                      onClick={flagMissing}
                    >
                      Don&apos;t see your option?
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <input
              aria-label="Tell us what went wrong"
              placeholder="Tell us what went wrong"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendNote();
                }
              }}
              className="border-control-border focus:border-primary min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-base outline-none focus:outline-none md:text-sm"
            />
            <button
              type="button"
              className="bg-primary text-primary-foreground cursor-pointer rounded-lg px-3 text-sm font-semibold"
              onClick={sendNote}
            >
              Send
            </button>
          </div>
          {thanks && <p className="text-muted-foreground text-sm">{thanks}</p>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const LEVELS = {
  critical: {
    card: 'border-destructive bg-red-50',
    label: 'text-destructive',
    title: 'Refine: this is really important',
    button: 'border-destructive text-destructive bg-white',
  },
  important: {
    card: 'border-orange-400 bg-orange-50',
    label: 'text-orange-800',
    title: 'Refine: this will change your results',
    button: 'border-orange-400 text-orange-900 bg-white',
  },
  helpful: {
    card: 'border-primary/30 bg-primary/10',
    label: 'text-primary',
    title: 'Help us refine your search',
    button: 'border-control-border bg-white',
  },
};

function CrisisCard() {
  return (
    <div
      className="bg-destructive text-destructive-foreground mt-3 flex flex-col gap-3 rounded-lg p-4"
      data-testid="search-crisis-card"
      role="alert"
    >
      <p className="text-lg font-semibold">
        You can talk to someone right now.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href="tel:988"
          className="text-destructive flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold no-underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          Call 988
        </a>
        <a
          href="tel:911"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-white px-4 font-semibold text-white no-underline"
        >
          Call 911
        </a>
      </div>
      <p className="text-sm">Your results are still below.</p>
    </div>
  );
}

/** Prototype: the refine question. It sits beside the results and never stops the person. */
export function SearchRefineQuestion() {
  const { label, codes, answered, decision, update, isPending } =
    useSuneSearch();
  const [collapsed, setCollapsed] = useAtom(refineCollapsedAtom);
  const [otherOpen, setOtherOpen] = useState(false);
  const [other, setOther] = useState('');
  const setFlagged = useSetAtom(flaggedAtom);
  const otherRef = useRef<HTMLInputElement>(null);
  const otherButtonRef = useRef<HTMLButtonElement>(null);
  useDismissOutside(otherRef, otherOpen, () => setOtherOpen(false));
  // Always refine: with nothing left to ask, the card still invites more.
  const question: Question = decision.question ?? {
    id: 'done',
    text: 'Is there anything else we should know?',
    why: 'Every question that changes the results is answered.',
    answers: [],
  };

  if (!label.trim()) return null;
  if (decision.kind === 'crisis') return <CrisisCard />;
  const style = LEVELS[decision.level];
  const submitOther = () => {
    const text = other.trim();
    setOther('');
    setOtherOpen(false);
    if (!text) return;
    const found = classifySune(text).codes as string[];
    if (found.length === 0) setFlagged((prev) => [...prev, text]);
    update([...new Set([...codes, ...found])], [...answered, question.id]);
  };
  const answer = (option?: Answer) => {
    update(option ? applyAnswer(codes, option) : codes, [
      ...answered,
      question.id,
    ]);
  };

  return (
    <div
      className={cn(
        'mt-3 flex flex-col gap-2 rounded-lg border p-3 md:gap-3 md:p-4',
        collapsed && 'max-md:py-0',
        style.card,
        isPending && 'opacity-70',
      )}
      data-level={decision.level}
      data-testid="search-refine-question"
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left md:min-h-0 md:cursor-default"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <span className={cn('text-sm font-semibold', style.label)}>
          {question.id === 'start'
            ? 'Your search is vague. Help us help you.'
            : style.title}
        </span>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-sm font-medium md:hidden">
          {collapsed ? 'Show' : 'Hide'}
          <ChevronDown
            className={cn('size-4', !collapsed && 'rotate-180')}
            aria-hidden="true"
          />
        </span>
      </button>
      <div
        className={cn(
          'flex flex-col gap-2 md:gap-3',
          collapsed && 'hidden md:flex',
        )}
      >
        <p className="text-base font-semibold md:text-xl">{question.text}</p>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          {question.answers.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={isPending}
              className={cn(
                'flex min-h-11 cursor-pointer flex-col items-start justify-center rounded-lg border px-3 py-2 text-left text-sm font-medium',
                style.button,
              )}
              onClick={() => answer(option)}
            >
              {option.label}
              <span className="text-muted-foreground text-xs font-normal">
                {option.keeps} {option.keeps === 1 ? 'result' : 'results'}
              </span>
            </button>
          ))}
          <button
            ref={otherButtonRef}
            type="button"
            data-dismiss-keep
            className={cn(
              'flex min-h-11 cursor-pointer items-center rounded-lg border border-dashed px-3 py-2 text-sm font-medium',
              style.button,
            )}
            onClick={() => setOtherOpen((prev) => !prev)}
          >
            Other
          </button>
          {decision.question && (
            <button
              type="button"
              className="text-muted-foreground min-h-11 cursor-pointer justify-self-start px-1 text-sm underline"
              onClick={() => answer()}
            >
              Skip
            </button>
          )}
        </div>
        {otherOpen && (
          <input
            ref={otherRef}
            autoFocus
            aria-label="Tell us in your own words"
            placeholder="Tell us in your own words"
            value={other}
            onChange={(event) => setOther(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitOther();
              }
              if (event.key === 'Escape') {
                setOtherOpen(false);
                otherButtonRef.current?.focus();
              }
            }}
            className="border-control-border focus:border-primary w-full rounded-lg border bg-white px-3 py-2 text-base outline-none focus:outline-none md:text-sm"
          />
        )}
      </div>
    </div>
  );
}

/** Demo only: shows Skyler what drove the screen. Not part of the proposed design. */
export function SearchClassifierPeek() {
  const { label, codes, decision } = useSuneSearch();
  const flagged = useAtomValue(flaggedAtom);
  if (!label.trim()) return null;
  const read = classifySune(label);

  return (
    <details className="text-muted-foreground mt-3 hidden text-xs md:block print:hidden">
      <summary className="cursor-pointer">
        Demo only: what the classifier saw
      </summary>
      <div className="mt-2 flex flex-col gap-1">
        {read.ranked.length === 0 && <p>No need found.</p>}
        {read.ranked.map(
          (need: { code: string; label: string; score: number }) => (
            <p key={need.code}>
              {need.label}: {Math.round(need.score * 100)}%
            </p>
          ),
        )}
        <p>Urgency: {labelOf(read.urgency as string)}</p>
        <p>Now: {codes.map((code) => labelOf(code)).join(', ') || 'nothing'}</p>
        <p>
          Decision: {decision.kind}, {decision.level}. {decision.question?.why}
        </p>
        {flagged.length > 0 && <p>Flagged as missing: {flagged.join(', ')}</p>}
      </div>
    </details>
  );
}
