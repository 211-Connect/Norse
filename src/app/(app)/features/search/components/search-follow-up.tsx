'use client';

import { atom, useAtom, useAtomValue } from 'jotai';
import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { queryLabelAtom } from '@/app/(app)/shared/store/search';

type Question = {
  /** The unknown this question closes. Ranked: most helpful first. */
  slot: string;
  text: string;
  answers: { label: string; tag?: string }[];
};

const WHEN: Question = {
  slot: 'urgency',
  text: 'When do you need help?',
  answers: [
    { label: 'Today', tag: 'Needs help today' },
    { label: 'This week', tag: 'Needs help this week' },
    { label: 'Ongoing', tag: 'Ongoing need' },
    { label: 'Planning ahead', tag: 'Planning ahead' },
  ],
};
const CAR: Question = {
  slot: 'transport',
  text: 'Do you have a car right now?',
  answers: [
    { label: 'Yes', tag: 'Has a car' },
    { label: 'No', tag: "Can't travel" },
    { label: 'Sometimes', tag: 'Limited rides' },
  ],
};
const CAR_INSURANCE: Question = {
  slot: 'barrier',
  text: 'What is stopping you from having car insurance now?',
  answers: [
    { label: 'The cost', tag: "Can't afford insurance" },
    { label: 'It lapsed', tag: 'Insurance lapsed' },
    { label: 'License problem', tag: 'License problem' },
  ],
};
const HOME_HELP: Question = {
  slot: 'support',
  text: 'Is anyone helping you at home right now?',
  answers: [
    { label: 'Yes', tag: 'Has help at home' },
    { label: 'No', tag: 'Lives alone' },
    { label: 'Not enough', tag: 'Caregiver is stretched' },
  ],
};

/** Prototype stand-in for classification: hardcoded per kind of sentence. */
function readSituation(text: string): { tags: string[]; questions: Question[] } {
  if (/hospital|cook|72/i.test(text)) {
    return {
      tags: ['Older adult', 'Just left the hospital', 'Needs meals'],
      questions: [CAR, HOME_HELP, WHEN],
    };
  }
  if (/insurance|car\b/i.test(text)) {
    return {
      tags: ['Needs transportation'],
      questions: [CAR_INSURANCE, WHEN],
    };
  }
  return { tags: ['Needs food'], questions: [WHEN, CAR] };
}

const TAG = 'bg-card border-primary rounded-lg border px-2 py-1 text-xs';
const PILL_BUTTON =
  'bg-card flex cursor-pointer items-center gap-1 rounded-lg border border-dashed px-2 py-1 text-xs';

const removedAtom = atom<string[]>([]);
const addedAtom = atom<string[]>([]);
const stepAtom = atom(0);

/** Prototype: what we think we know, under the search box. */
export function SearchSituationTags() {
  const label = useAtomValue(queryLabelAtom) ?? '';
  const situation = useMemo(() => readSituation(label), [label]);
  const [removed, setRemoved] = useAtom(removedAtom);
  const [added, setAdded] = useAtom(addedAtom);
  const [panel, setPanel] = useState<'none' | 'wrong' | 'add'>('none');
  const [draft, setDraft] = useState('');

  if (!label.trim()) return null;

  const tags = [...situation.tags, ...added].filter(
    (tag) => !removed.includes(tag),
  );
  const closePanel = () => {
    setPanel('none');
    setDraft('');
  };
  const commit = () => {
    if (panel === 'add' && draft.trim()) {
      setAdded((prev) => [...prev, draft.trim()]);
    }
    closePanel();
  };

  const pillInput = (placeholder: string) => (
    <input
      autoFocus
      aria-label={placeholder}
      value={draft}
      placeholder={placeholder}
      size={Math.max(draft.length, placeholder.length) + 1}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') closePanel();
      }}
      className="bg-card border-primary max-w-full rounded-lg border px-2 py-1 text-xs outline-none focus:outline-none"
    />
  );

  return (
    <div
      className="flex w-full flex-wrap items-center gap-1.5"
      data-testid="search-situation-tags"
    >
      {tags.map((tag) => (
        <span key={tag} className={`${TAG} flex items-center gap-1`}>
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="cursor-pointer"
            onClick={() => setRemoved((prev) => [...prev, tag])}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      {panel === 'add' ? (
        pillInput('Type here')
      ) : (
        <button
          type="button"
          className={PILL_BUTTON}
          onClick={() => setPanel('add')}
        >
          <Plus className="size-3" aria-hidden="true" />
          Add
        </button>
      )}
      {panel === 'wrong' ? (
        pillInput('What did we get wrong?')
      ) : (
        <button
          type="button"
          className={PILL_BUTTON}
          onClick={() => setPanel('wrong')}
        >
          Something is wrong
        </button>
      )}
    </div>
  );
}

/** Prototype: the most useful next question. */
export function SearchRefineQuestion() {
  const label = useAtomValue(queryLabelAtom) ?? '';
  const situation = useMemo(() => readSituation(label), [label]);
  const [, setAdded] = useAtom(addedAtom);
  const [step, setStep] = useAtom(stepAtom);
  const question = situation.questions[step];

  if (!label.trim() || !question) return null;

  const answer = (tag?: string) => {
    if (tag) setAdded((prev) => [...prev, tag]);
    setStep((prev) => prev + 1);
  };

  return (
    <div
      className="bg-card mt-3 flex flex-col gap-3 rounded-lg border p-4"
      data-testid="search-refine-question"
    >
      <p className="text-muted-foreground text-xs font-semibold">
        Help us refine your search
      </p>
      <p className="text-xl font-semibold">{question.text}</p>
      <div className="flex flex-wrap gap-2">
        {question.answers.map((option) => (
          <Button
            key={option.label}
            type="button"
            variant="outline"
            onClick={() => answer(option.tag)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <button
        type="button"
        className="text-muted-foreground cursor-pointer self-start text-xs underline"
        onClick={() => answer()}
      >
        Skip
      </button>
    </div>
  );
}
