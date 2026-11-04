'use client';

import { useAtomValue } from 'jotai';
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

/** Prototype: what we think we know, then the most useful next question. */
export function SearchSituation() {
  const label = useAtomValue(queryLabelAtom) ?? '';
  const situation = useMemo(() => readSituation(label), [label]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [panel, setPanel] = useState<'none' | 'wrong' | 'add'>('none');
  const [draft, setDraft] = useState('');

  if (!label.trim()) return null;

  const tags = [...situation.tags, ...added].filter(
    (tag) => !removed.includes(tag),
  );
  const question = situation.questions[step];

  const answer = (tag?: string) => {
    if (tag) setAdded((prev) => [...prev, tag]);
    setStep((prev) => prev + 1);
  };
  const closePanel = () => {
    setPanel('none');
    setDraft('');
  };

  return (
    <div className="mt-3 flex flex-col gap-4" data-testid="search-situation">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold">
          Looks like this is your situation
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
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
          <button
            type="button"
            className="bg-card flex cursor-pointer items-center gap-1 rounded-lg border border-dashed px-2 py-1 text-xs"
            onClick={() => setPanel('add')}
          >
            <Plus className="size-3" aria-hidden="true" />
            Add
          </button>
        </div>
        <button
          type="button"
          className="text-primary cursor-pointer self-start text-xs underline"
          onClick={() => setPanel('wrong')}
        >
          Something is wrong
        </button>
        {panel !== 'none' && (
          <div className="bg-card flex flex-col gap-2 rounded-lg border p-2">
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                panel === 'add' ? 'For example: Veteran' : 'What did we get wrong?'
              }
              className="border-control-border rounded-lg border p-2 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  if (panel === 'add' && draft.trim()) {
                    setAdded((prev) => [...prev, draft.trim()]);
                  }
                  closePanel();
                }}
              >
                {panel === 'add' ? 'Add' : 'Send'}
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={closePanel}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {question && (
        <div className="bg-card flex flex-col gap-3 rounded-lg border p-4">
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
      )}
    </div>
  );
}
