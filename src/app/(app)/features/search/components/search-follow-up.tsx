'use client';

import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { cn } from '@/app/(app)/shared/lib/utils';
import {
  queryLabelAtom,
} from '@/app/(app)/shared/store/search';

const URGENCY = ['Today', 'This week', 'Ongoing', 'Planning ahead'];

/**
 * Prototype: results first, then optional follow-up. The answers change
 * nothing yet: the fake backend does not read them.
 */
export function SearchFollowUp({ total }: { total: number }) {
  const label = useAtomValue(queryLabelAtom);
  const [step, setStep] = useState<'ask' | 'more' | 'thanks' | 'closed'>('ask');
  const [urgency, setUrgency] = useState('');
  const [extra, setExtra] = useState('');
  const mentionsMore = /daughter|son|caregiver|driv/i.test(label ?? '');

  return (
    <div className="flex flex-col gap-3" data-testid="search-follow-up">
      <div className="bg-card rounded-lg border p-3">
        <p className="text-sm">
          <span className="font-semibold">
            {total} programs for what you described.
          </span>{' '}
          Best matches first.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="border-primary rounded-full border px-2 py-1">
            Meals at home
          </span>
          {mentionsMore && (
            <span className="border-primary rounded-full border px-2 py-1">
              Help for a family caregiver
            </span>
          )}
          {mentionsMore && (
            <span className="border-primary rounded-full border px-2 py-1">
              Rides
            </span>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-3">
        <p className="mb-2 text-sm font-semibold">When do you need help?</p>
        <div className="flex flex-wrap gap-2">
          {URGENCY.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={urgency === option}
              onClick={() => setUrgency(urgency === option ? '' : option)}
              className={cn(
                'cursor-pointer rounded-lg border-2 px-3 py-1 text-xs transition-colors',
                urgency === option
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {step === 'ask' && (
        <div className="bg-primary/5 flex items-center justify-between gap-3 rounded-lg p-3">
          <p className="text-sm font-semibold">Did this help?</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStep('thanks')}>
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStep('more')}
            >
              Not quite
            </Button>
          </div>
        </div>
      )}
      {step === 'more' && (
        <div className="bg-primary/5 flex flex-col gap-2 rounded-lg p-3">
          <p className="text-sm font-semibold">What were you hoping to find?</p>
          <p className="text-muted-foreground text-xs">
            Narrow these results, or tell us about another need.
          </p>
          <textarea
            rows={2}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
            placeholder="For example: somewhere I can go on Saturday."
            className="border-control-border w-full resize-none rounded-lg border bg-white p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setStep('thanks')}>
              Search again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStep('closed')}
            >
              Not now
            </Button>
          </div>
        </div>
      )}
      {step === 'thanks' && (
        <p className="text-muted-foreground text-sm">Thank you.</p>
      )}
    </div>
  );
}
