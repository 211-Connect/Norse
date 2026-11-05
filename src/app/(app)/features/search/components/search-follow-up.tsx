'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  ArrowUp,
  Check,
  ChevronDown,
  GripVertical,
  Phone,
  Plus,
  X,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type DOMAttributes,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';

import { useDismissOutside } from '@/app/(app)/shared/hooks/use-dismiss-outside';
import { queryLabelAtom } from '@/app/(app)/shared/store/search';
import { cn } from '@/app/(app)/shared/lib/utils';

import {
  applyAnswers,
  classifySune,
  decideRefine,
  isRankToken,
  labelOf,
  lookup,
  matchAddable,
  matchServices,
  orderToken,
  rankKinds,
  removedToken,
} from '../sune-demo/sune.mjs';

type Answer = {
  label: string;
  add: string[];
  remove?: string[];
  keeps: number;
};
type Question = {
  id: string;
  text: string;
  why: string;
  multi?: boolean;
  answers: Answer[];
};
type Kind = { key: string; label: string; description: string };
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

  // The person's order of the kinds of help. A change of tags drops it: the list is rebuilt from the tags.
  const ranks = stated.filter((code) => isRankToken(code));

  const update = (
    nextCodes: string[],
    nextAnswered = answered,
    nextRanks: string[] = [],
  ) => {
    const next = new URLSearchParams(params.toString());
    next.delete('taxonomy');
    next.delete('page');
    // U-X is SUNE's "not yet known": it keeps an emptied search from being classified again.
    for (const code of nextCodes.length ? nextCodes : ['U-X']) {
      next.append('taxonomy', code);
    }
    for (const token of nextRanks) next.append('taxonomy', token);
    next.set('refined', nextAnswered.join(','));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  return { label, codes, ranks, answered, decision, update, isPending };
}

const TAG =
  'bg-card border-primary flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm';
const ADD_PILL =
  'bg-primary/10 text-primary border-primary/50 flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-dashed px-3 py-1.5 text-sm font-medium';

/** Terms a person could not find. A stand-in for a real report to our system. */
export const flaggedAtom = atom<string[]>([]);
/** Corrections kept for review. A stand-in: one person's correction never changes the shared mapping. */
export const suggestionsAtom = atom<string[]>([]);

const ROW_BUTTON =
  'hover:bg-primary/5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg';

type Ranked = { key: string; label: string; description?: string };

/** One ranked item. The whole row drags; the grip is the keyboard way in. */
function RankRow({
  item,
  at,
  onRemove,
}: {
  item: Ranked;
  at: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.key });
  // The mouse and touch start on the row; the keyboard starts on the grip.
  const handlers = listeners as DOMAttributes<HTMLElement> | undefined;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onMouseDown={handlers?.onMouseDown}
      onTouchStart={handlers?.onTouchStart}
      className={cn(
        'bg-card flex cursor-grab touch-manipulation items-center gap-2 rounded-lg border py-1.5 pr-1 pl-1 select-none',
        isDragging && 'border-primary relative z-10 cursor-grabbing shadow-lg',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        onKeyDown={handlers?.onKeyDown}
        aria-label={`Rank ${item.label}, now number ${at + 1}. Press space, then the arrow keys.`}
        className="text-muted-foreground flex h-9 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      >
        {at + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.label}</span>
        {item.description && (
          <span className="text-muted-foreground block text-xs">
            {item.description}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={`Remove ${item.label}`}
        className={ROW_BUTTON}
        onClick={onRemove}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** A list a person ranks by dragging. Step 1 ranks needs; step 2 ranks kinds of help. */
function RankList({
  items,
  label,
  listRef,
  onRemove,
  onReorder,
  testId,
}: {
  items: Ranked[];
  label: string;
  listRef?: RefObject<HTMLOListElement | null>;
  onRemove: (item: Ranked) => void;
  onReorder: (items: Ranked[]) => void;
  testId: string;
}) {
  const [said, setSaid] = useState('');
  // A drop shows at once; the URL and the rerun catch up behind it.
  const [list, setList] = useState(items);
  const order = items.map((item) => item.key).join();
  useEffect(() => {
    setList(items);
  }, [order]);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const drop = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const keys = list.map((item) => item.key);
    const to = keys.indexOf(String(over.id));
    const next = arrayMove(list, keys.indexOf(String(active.id)), to);
    setList(next);
    onReorder(next);
    setSaid(`${next[to].label} is now number ${to + 1}.`);
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={drop}
      sensors={sensors}
    >
      <SortableContext
        items={list.map((item) => item.key)}
        strategy={verticalListSortingStrategy}
      >
        <ol
          ref={listRef}
          tabIndex={-1}
          aria-label={label}
          className="flex flex-col gap-1 outline-none"
          data-testid={testId}
        >
          {list.map((item, at) => (
            <RankRow
              key={item.key}
              item={item}
              at={at}
              onRemove={() => onRemove(item)}
            />
          ))}
        </ol>
      </SortableContext>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </DndContext>
  );
}

/** Phase 2 of the help panel: the kinds of help behind the search, in the order we rank them. */
function RankStep({
  kinds,
  removed,
  onChange,
  onMissing,
}: {
  kinds: Kind[];
  removed: Kind[];
  onChange: (kinds: Kind[], removed: Kind[]) => void;
  onMissing: (text: string) => void;
}) {
  // Remove and Put back delete the button in focus, so focus goes to the list.
  const listRef = useRef<HTMLOListElement>(null);
  const remove = (item: Ranked) => {
    onChange(
      kinds.filter((kind) => kind.key !== item.key),
      [...removed, item as Kind],
    );
    listRef.current?.focus();
  };
  const putBack = (kind: Kind) => {
    onChange(
      [...kinds, kind],
      removed.filter((item) => item.key !== kind.key),
    );
    listRef.current?.focus();
  };

  return (
    <>
      <RankList
        items={kinds}
        label="Kinds of help, ranked"
        listRef={listRef}
        onRemove={remove}
        onReorder={(next) => onChange(next as Kind[], removed)}
        testId="search-rank-list"
      />
      {kinds.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nothing left. Put one back or add what is missing.
        </p>
      )}
      {removed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Removed:</span>
          {removed.map((kind) => (
            <button
              key={kind.key}
              type="button"
              aria-label={`Put back ${kind.label}`}
              className={ADD_PILL}
              onClick={() => putBack(kind)}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {kind.label}
            </button>
          ))}
        </div>
      )}
      <OtherBox placeholder="Add what is missing" onSubmit={onMissing} />
    </>
  );
}

/**
 * Prototype: tags stay out of the way until a person says the results look wrong.
 * The button appears as the 3rd result comes into view, or at once with fewer than 3.
 */
export function SearchResultsHelp() {
  const { label, codes, ranks, answered, update } = useSuneSearch();
  const setFlagged = useSetAtom(flaggedAtom);
  const setSuggestions = useSetAtom(suggestionsAtom);
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'tags' | 'rank' | 'done'>('tags');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
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
      if (!third || third.getBoundingClientRect().top < window.innerHeight) {
        setShown(true);
      }
    };
    const settled = setTimeout(check, 1500);
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      clearTimeout(settled);
      window.removeEventListener('scroll', check);
    };
  }, [label]);

  if (!label.trim() || !shown) return null;

  const { kinds, removed } = rankKinds([...codes, ...ranks]) as {
    kinds: Kind[];
    removed: Kind[];
  };
  const reorder = (nextKinds: Kind[], nextRemoved: Kind[]) =>
    update(codes, answered, [
      ...nextKinds.map((kind) => orderToken(kind.key)),
      ...nextRemoved.map((kind) => removedToken(kind.key)),
    ]);
  const reportMissing = (text: string) => {
    setFlagged((prev) => [...prev, text]);
    setThanks(`Thank you. We will look at adding “${text}”.`);
  };
  // The search already changed for this person. The shared mapping waits for a review.
  const finish = () => {
    const tags = codes.map((code) => labelOf(code)).join(', ');
    const order = kinds.map((kind) => kind.label).join(' > ');
    setSuggestions((prev) => [...prev, `“${label}”: ${tags}: ${order}`]);
    setThanks('');
    setPhase('done');
  };
  const needs = codes.filter((code: string) => code.startsWith('N-'));
  const others = codes.filter((code: string) => !code.startsWith('N-'));
  const TITLES = {
    tags: 'Did we get your needs right?',
    rank: 'Do these solutions look right?',
    done: 'Thank you',
  };
  const DESCRIPTIONS = {
    tags:
      needs.length > 1
        ? 'Drag to rank. 1 matters most.'
        : 'Remove or add what you need.',
    rank: 'Drag to rank. 1 is the best fit.',
    done: 'Your results are updated.',
  };

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

  return createPortal(
    <DialogPrimitive.Root
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPhase('tags');
        setThanks('');
      }}
    >
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
            <div>
              {phase !== 'done' && (
                <p className="text-muted-foreground text-xs">
                  Step {phase === 'tags' ? 1 : 2} of 2
                </p>
              )}
              <DialogPrimitive.Title className="text-lg font-semibold">
                {TITLES[phase]}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex size-8 cursor-pointer items-center justify-center"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="text-muted-foreground text-sm">
            {DESCRIPTIONS[phase]}
          </DialogPrimitive.Description>
          {phase === 'rank' && (
            <RankStep
              kinds={kinds}
              removed={removed}
              onChange={reorder}
              onMissing={reportMissing}
            />
          )}
          {phase === 'tags' && (
            <>
              <RankList
                items={needs.map((code) => ({
                  key: code,
                  label: labelOf(code),
                }))}
                label="Your needs, ranked"
                onRemove={(item) =>
                  update(codes.filter((code) => code !== item.key))
                }
                onReorder={(next) =>
                  update([...next.map((item) => item.key), ...others])
                }
                testId="search-need-list"
              />
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="search-situation-tags"
              >
                {others.map((code: string) => (
                  <span key={code} className={TAG}>
                    {labelOf(code)}
                    <button
                      type="button"
                      aria-label={`Remove ${labelOf(code)}`}
                      className="cursor-pointer"
                      onClick={() =>
                        update(codes.filter((item) => item !== code))
                      }
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
            </>
          )}
          {thanks && <p className="text-muted-foreground text-sm">{thanks}</p>}
          {phase !== 'done' && (
            <div className="flex items-center justify-between gap-2">
              {phase === 'rank' ? (
                <button
                  type="button"
                  className="text-primary cursor-pointer px-1 py-2 text-sm font-medium"
                  onClick={() => {
                    setThanks('');
                    setPhase('tags');
                  }}
                >
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                data-testid="search-help-looks-good"
                className="bg-primary text-primary-foreground cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  if (phase === 'tags') {
                    setThanks('');
                    setPhase('rank');
                  } else {
                    finish();
                  }
                }}
              >
                Looks good
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>,
    document.body,
  );
}

/** A typed answer, in its own box beside the listed answers. */
export function OtherBox({
  className,
  onSubmit,
  placeholder,
}: {
  className?: string;
  onSubmit: (text: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            send();
          }
        }}
        className="border-control-border focus:border-primary min-h-12 w-full rounded-lg border bg-white py-2 pr-12 pl-4 text-base outline-none focus:outline-none"
        data-testid="other-box"
      />
      <button
        type="button"
        aria-label="Send"
        className="bg-primary text-primary-foreground absolute top-2 right-2 flex size-8 cursor-pointer items-center justify-center rounded-lg"
        onClick={send}
      >
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
    </div>
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

/** The answers ticked on a multi-select question. A new question starts empty. */
export function useAnswerPicks(questionId?: string) {
  const [state, setState] = useState<{ id?: string; labels: string[] }>({
    labels: [],
  });
  const picks = state.id === questionId ? state.labels : [];
  const toggle = (label: string) =>
    setState((prev) => {
      const labels = prev.id === questionId ? prev.labels : [];
      return {
        id: questionId,
        labels: labels.includes(label)
          ? labels.filter((pick) => pick !== label)
          : [...labels, label],
      };
    });
  return { picks, toggle };
}

/** The tick box on a multi-select answer, so a picked answer does not rely on color alone. */
export function PickMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded border',
        on
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-control-border bg-white',
      )}
    >
      {on && <Check className="size-3.5" />}
    </span>
  );
}

export const PICKED = 'border-primary bg-primary/10 text-foreground';
export const resultCount = (count: number) =>
  `${count} ${count === 1 ? 'result' : 'results'}`;

/** Prototype: the refine question. It sits beside the results and never stops the person. */
export function SearchRefineQuestion() {
  const { label, codes, answered, decision, update, isPending } =
    useSuneSearch();
  const [collapsed, setCollapsed] = useAtom(refineCollapsedAtom);
  const setFlagged = useSetAtom(flaggedAtom);
  // Always refine: with nothing left to ask, the card still invites more.
  const question: Question = decision.question ?? {
    id: 'done',
    text: 'Is there anything else we should know?',
    why: 'Every question that changes the results is answered.',
    answers: [],
  };
  const { picks, toggle } = useAnswerPicks(question.id);
  const chosen = question.answers.filter((a) => picks.includes(a.label));
  const withPicks = applyAnswers(codes, chosen) as string[];

  if (!label.trim()) return null;
  if (decision.kind === 'crisis') return <CrisisCard />;
  const style = LEVELS[decision.level];
  const submitOther = (text: string) => {
    const found = classifySune(text).codes as string[];
    if (found.length === 0) setFlagged((prev) => [...prev, text]);
    update([...new Set([...withPicks, ...found])], [...answered, question.id]);
  };
  const answer = (options: Answer[] = []) => {
    update(applyAnswers(codes, options) as string[], [
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
        <div>
          <p
            id="refine-question"
            className="text-base font-semibold md:text-xl"
          >
            {question.text}
          </p>
          {question.multi && (
            <p className="text-muted-foreground text-sm">Pick all that fit.</p>
          )}
        </div>
        <div
          role="group"
          aria-labelledby="refine-question"
          className="grid grid-cols-2 gap-2 md:flex md:flex-wrap"
        >
          {question.answers.map((option) => {
            const on = picks.includes(option.label);
            return (
              <button
                key={option.label}
                type="button"
                disabled={isPending}
                aria-pressed={question.multi ? on : undefined}
                className={cn(
                  'flex min-h-11 cursor-pointer rounded-lg border px-3 py-2 text-left text-sm font-medium',
                  question.multi
                    ? 'items-center gap-2'
                    : 'flex-col items-start justify-center',
                  style.button,
                  on && PICKED,
                )}
                onClick={() =>
                  question.multi ? toggle(option.label) : answer([option])
                }
              >
                {question.multi && <PickMark on={on} />}
                {option.label}
                {!question.multi && (
                  <span className="text-muted-foreground text-xs font-normal">
                    {resultCount(option.keeps)}
                  </span>
                )}
              </button>
            );
          })}
          <OtherBox
            className="col-span-2"
            placeholder={
              decision.question
                ? 'Other: type your own'
                : 'Tell us in your own words'
            }
            onSubmit={submitOther}
          />
          {decision.question && picks.length === 0 && (
            <button
              type="button"
              className="text-muted-foreground min-h-11 cursor-pointer justify-self-start px-1 text-sm underline"
              onClick={() => answer()}
            >
              Skip
            </button>
          )}
          {picks.length > 0 && (
            <button
              type="button"
              disabled={isPending}
              className="bg-primary text-primary-foreground col-span-2 min-h-11 cursor-pointer rounded-lg px-5 text-sm font-semibold disabled:opacity-60"
              data-testid="refine-continue"
              onClick={() => answer(chosen)}
            >
              Continue: {resultCount(matchServices(withPicks).length)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Demo only: shows Skyler what drove the screen. Not part of the proposed design. */
export function SearchClassifierPeek() {
  const { label, codes, decision } = useSuneSearch();
  const flagged = useAtomValue(flaggedAtom);
  const suggestions = useAtomValue(suggestionsAtom);
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
        {suggestions.map((suggestion) => (
          <p key={suggestion}>Kept for review: {suggestion}</p>
        ))}
      </div>
    </details>
  );
}
