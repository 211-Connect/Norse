'use client';

import { atom, useAtom, useAtomValue } from 'jotai';
import { ChevronDown, Phone, Plus, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { queryLabelAtom } from '@/app/(app)/shared/store/search';
import { cn } from '@/app/(app)/shared/lib/utils';

import {
  ADDABLE,
  applyAnswer,
  classifySune,
  decideRefine,
  labelOf,
  lookup,
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
const WRONG_PILL =
  'flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900';

/** Terms a person added that SUNE does not have: the data gaps. */
const gapsAtom = atom<Record<string, string[]>>({});

/** Prototype: what we think we know, under the search box. */
export function SearchSituationTags() {
  const { label, codes, update } = useSuneSearch();
  const [gapsByQuery, setGaps] = useAtom(gapsAtom);
  const [panel, setPanel] = useState<'none' | 'wrong' | 'add'>('none');
  const [draft, setDraft] = useState('');
  const [thanks, setThanks] = useState(false);

  if (!label.trim()) return null;

  const gaps = gapsByQuery[label] ?? [];
  const typed = draft.trim().toLowerCase();
  const matches = typed
    ? ADDABLE.filter(
        (term: { code: string; label: string; hint: string }) =>
          !codes.includes(term.code) &&
          `${term.label} ${term.hint}`.toLowerCase().includes(typed),
      ).slice(0, 5)
    : [];

  const closePanel = () => {
    setPanel('none');
    setDraft('');
  };
  const addGap = () => {
    if (draft.trim()) {
      setGaps((prev) => ({ ...prev, [label]: [...gaps, draft.trim()] }));
    }
    closePanel();
  };
  const sendWrong = () => {
    setThanks(Boolean(draft.trim()));
    closePanel();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
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
        {gaps.map((gap) => (
          <span key={gap} className={cn(TAG, 'border-dashed')}>
            {gap}
            <button
              type="button"
              aria-label={`Remove ${gap}`}
              className="cursor-pointer"
              onClick={() =>
                setGaps((prev) => ({
                  ...prev,
                  [label]: gaps.filter((item) => item !== gap),
                }))
              }
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className={ADD_PILL}
          onClick={() => setPanel(panel === 'add' ? 'none' : 'add')}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add
        </button>
        <button
          type="button"
          className={WRONG_PILL}
          onClick={() => setPanel(panel === 'wrong' ? 'none' : 'wrong')}
        >
          Something is wrong
        </button>
      </div>
      {panel !== 'none' && (
        <div className="flex flex-col gap-1">
          <input
            autoFocus
            aria-label={
              panel === 'add' ? 'Add a need' : 'What did we get wrong?'
            }
            value={draft}
            placeholder={
              panel === 'add'
                ? 'Add a need or something about you'
                : 'What did we get wrong?'
            }
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (panel === 'wrong') sendWrong();
                else if (matches[0]) {
                  update([...codes, matches[0].code]);
                  closePanel();
                } else addGap();
              }
              if (event.key === 'Escape') closePanel();
            }}
            className="bg-card border-primary w-full rounded-lg border px-3 py-2 text-base outline-none focus:outline-none md:text-sm"
          />
          {panel === 'add' && matches.length > 0 && (
            <ul className="bg-card rounded-lg border">
              {matches.map((term: { code: string; label: string }) => (
                <li key={term.code}>
                  <button
                    type="button"
                    className="hover:bg-primary/5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm"
                    onClick={() => {
                      update([...codes, term.code]);
                      closePanel();
                    }}
                  >
                    {term.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {panel === 'add' && typed && matches.length === 0 && (
            <button
              type="button"
              className="text-primary cursor-pointer self-start px-1 text-sm underline"
              onClick={addGap}
            >
              We don&apos;t have &ldquo;{draft.trim()}&rdquo; yet. Add it, and
              tell us it is missing.
            </button>
          )}
        </div>
      )}
      {thanks && (
        <p className="text-muted-foreground text-sm">
          Thank you. We use this to fix our mistakes.
        </p>
      )}
    </div>
  );
}

const LEVELS = {
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
    card: 'bg-card',
    label: 'text-muted-foreground',
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
  const [gapsByQuery, setGaps] = useAtom(gapsAtom);
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
    if (found.length === 0) {
      setGaps((prev) => ({
        ...prev,
        [label]: [...(gapsByQuery[label] ?? []), text],
      }));
    }
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
        'mt-3 flex flex-col gap-3 rounded-lg border p-4',
        style.card,
        isPending && 'opacity-70',
      )}
      data-level={decision.level}
      data-testid="search-refine-question"
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        className="flex cursor-pointer items-center justify-between gap-2 text-left md:cursor-default"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <span className={cn('text-sm font-semibold', style.label)}>
          {question.id === 'start'
            ? 'Your search is vague. Help us help you.'
            : style.title}
        </span>
        <ChevronDown
          className={cn('size-5 md:hidden', collapsed && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div className={cn('flex flex-col gap-3', collapsed && 'hidden md:flex')}>
        <p className="text-lg font-semibold md:text-xl">{question.text}</p>
        <div className="flex flex-wrap gap-2">
          {question.answers.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={isPending}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium',
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
            type="button"
            className={cn(
              'flex min-h-11 cursor-pointer items-center rounded-lg border border-dashed px-3 py-2 text-sm font-medium',
              style.button,
            )}
            onClick={() => setOtherOpen((prev) => !prev)}
          >
            Other
          </button>
        </div>
        {otherOpen && (
          <input
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
              if (event.key === 'Escape') setOtherOpen(false);
            }}
            className="border-control-border focus:border-primary w-full rounded-lg border bg-white px-3 py-2 text-base outline-none focus:outline-none md:text-sm"
          />
        )}
        {decision.question && (
          <button
            type="button"
            className="text-muted-foreground cursor-pointer self-start text-sm underline"
            onClick={() => answer()}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

/** Demo only: shows Skyler what drove the screen. Not part of the proposed design. */
export function SearchClassifierPeek() {
  const { label, codes, decision } = useSuneSearch();
  if (!label.trim()) return null;
  const read = classifySune(label);

  return (
    <details className="text-muted-foreground mt-3 text-xs print:hidden">
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
      </div>
    </details>
  );
}
