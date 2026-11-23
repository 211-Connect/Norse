'use client';

import { Phone } from 'lucide-react';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { cn } from '@/app/(app)/shared/lib/utils';

import { stringsOf, type V2Hotline } from '../v2/use-v2-search';
import { DialButton } from './dial-button';
import type { Answer, Question } from './search-follow-up';

/**
 * The numbers a person can call. They come only from the emergency question (`hotlines[]`); the
 * UI has no default list (contract v2), so with none sent nothing is drawn.
 */
export function HotlineNumbers({
  hotlines = [],
  soft = false,
}: {
  hotlines?: V2Hotline[];
  soft?: boolean;
}) {
  if (hotlines.length === 0) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="search-hotline">
      <p className={cn('font-semibold', soft ? 'text-base' : 'text-lg')}>
        You can talk to someone right now.
      </p>
      <div className="flex flex-wrap gap-2">
        {hotlines.map((line, i) => (
          <DialButton
            key={line.number}
            number={line.number}
            ariaLabel={`Call ${line.number}, ${line.label}`}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold no-underline',
              i === 0
                ? soft
                  ? 'bg-orange-700 text-white'
                  : 'bg-red-700 text-white'
                : soft
                  ? 'border border-orange-700 bg-white text-orange-900'
                  : 'border border-red-700 bg-white text-red-700',
            )}
          >
            {i === 0 && <Phone className="size-4" aria-hidden="true" />}
            Call {line.number}
          </DialButton>
        ))}
      </div>
    </div>
  );
}

/**
 * The emergency card: the question, the hotline numbers and the answers (urgency answers only;
 * none for a caller U-0), in the page like every other question and with no popup (Lucas,
 * 2026-11-13). `soft` is the calmer orange card (placement before_results, not the popup). Without a question
 * it is the numbers alone, so a skip never takes the numbers away. It is the one live region.
 */
export function EmergencyBox({
  question,
  hotlines,
  soft = false,
  onAnswer,
  onSkip,
  skipLabel = stringsOf().skipToResults,
  headingId = 'emergency-question',
  announce = true,
}: {
  question?: Question;
  hotlines?: V2Hotline[];
  soft?: boolean;
  onAnswer?: (answer: Answer) => void;
  onSkip?: () => void;
  /** `clarification.strings.skip_to_results` from the API. */
  skipLabel?: string;
  headingId?: string;
  /** False while the popup holds the one announcement, so the card behind it is not a second alert. */
  announce?: boolean;
}) {
  return (
    <section
      aria-label="Emergency help"
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 md:gap-3 md:p-4',
        soft ? 'border-orange-400 bg-orange-50' : 'border-red-700 bg-red-50',
      )}
      data-testid="search-emergency"
      data-soft={soft}
      role={announce ? (soft ? 'status' : 'alert') : undefined}
    >
      {question && (
        <h2
          id={headingId}
          tabIndex={-1}
          className={cn(
            'text-base font-semibold outline-none md:text-xl',
            soft ? 'text-orange-900' : 'text-red-700',
          )}
        >
          {question.text}
        </h2>
      )}
      <HotlineNumbers hotlines={hotlines} soft={soft} />
      {question && (question.answers.length > 0 || onSkip) && (
        <div
          role="group"
          aria-labelledby={headingId}
          className="grid grid-cols-2 gap-2 md:flex md:flex-wrap"
        >
          {question.answers.map((option) => (
            <Button
              variant="outline"
              key={option.label}
              type="button"
              className={cn(
                'h-auto min-h-11 justify-start rounded-lg bg-white px-3 py-2 text-left text-sm',
                soft
                  ? 'border-orange-400 text-orange-900'
                  : 'border-red-700 text-red-700',
              )}
              onClick={() => onAnswer?.(option)}
            >
              {option.label}
            </Button>
          ))}
          {onSkip && (
            <Button
              variant="link"
              type="button"
              className={cn(
                'col-span-2 h-auto min-h-11 justify-self-start px-1 text-left text-sm underline',
                soft ? 'text-orange-900' : 'text-red-700',
              )}
              data-testid="emergency-skip"
              onClick={onSkip}
            >
              {skipLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/** The numbers in one thin row, for the pinned block on a phone. */
export function PinnedNumbers({
  hotlines = [],
}: {
  hotlines?: V2Hotline[];
}) {
  if (hotlines.length === 0) return null;
  return (
    <div className="flex gap-2" data-testid="search-hotline-pinned">
      {hotlines.map((line, i) => (
        <DialButton
          key={line.number}
          number={line.number}
          ariaLabel={`Call ${line.number}, ${line.label}`}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold no-underline',
            i === 0
              ? 'bg-red-700 text-white'
              : 'border border-red-700 bg-white text-red-700',
          )}
        >
          {i === 0 && <Phone className="size-4" aria-hidden="true" />}
          Call {line.number}
        </DialButton>
      ))}
    </div>
  );
}
