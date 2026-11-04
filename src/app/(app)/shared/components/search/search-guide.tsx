'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';

import {
  flaggedAtom,
  LEVELS,
} from '@/app/(app)/features/search/components/search-follow-up';
import { useNavigateAiSearch } from '@/app/(app)/features/search/hooks';
import {
  applyAnswer,
  classifySune,
  decideRefine,
  lookup,
} from '@/app/(app)/features/search/sune-demo/sune.mjs';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';

import { useAppConfig } from '../../hooks/use-app-config';
import { useFlag } from '../../hooks/use-flag';
import {
  LOCATION_INPUT_ID,
  SEARCH_DIALOG_ID,
  SEARCH_INPUT_ID,
} from '../../lib/constants';
import { cn } from '../../lib/utils';
import {
  searchCoordinatesAtom,
  searchLocationAtom,
  searchTermAtom,
  userCoordinatesAtom,
} from '../../store/search';
import { LocationSearchBar } from './location-search-bar';
import { SearchCrisisButton, SearchNeedInput } from './search-need-form';

/** More questions than this tires people out; the rest wait on the results page. */
const MAX_QUESTIONS = 3;

type Answer = { label: string; add: string[]; keeps: number };
type View = {
  step: 'need' | 'location' | 'question';
  codes: string[];
  answered: string[];
  locationDone: boolean;
};

const known = (text: string) =>
  (classifySune(text).codes as string[]).filter(
    (code) => code !== 'U-X' && lookup(code),
  );

/**
 * Prototype: one question at a time, under a header that stays in view.
 * Non-modal, so Quick exit and the nav still work. "See results" is on every step.
 */
export function SearchGuide({
  focusByDefault = 'search',
  restoreFocusElement,
  setOpen,
}: {
  focusByDefault?: 'search' | 'location';
  restoreFocusElement?: HTMLElement | null;
  setOpen: (open: boolean) => void;
}) {
  const appConfig = useAppConfig();
  const searchTerm = useAtomValue(searchTermAtom);
  const searchLocation = useAtomValue(searchLocationAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const setFlagged = useSetAtom(flaggedAtom);
  const requireLocation = useFlag('requireUserLocation');
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigateAiSearch({
    setDialogOpen: setOpen,
    startTransition,
  });

  const [view, setView] = useState<View>({
    step: focusByDefault === 'location' ? 'location' : 'need',
    codes: [],
    answered: [],
    locationDone: false,
  });
  const [history, setHistory] = useState<View[]>([]);
  const [needError, setNeedError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const [other, setOther] = useState('');
  const [top, setTop] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const query = searchTerm.trim();
  const decision = decideRefine(query, view.codes, view.answered);
  const question = decision.question;
  const style = LEVELS[decision.level as keyof typeof LEVELS];

  // The panel starts under the header, so the logo and nav never leave the screen.
  useEffect(() => {
    const header = document.querySelector('header');
    setTop(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
    return () => restoreFocusElement?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new step is an action the person took, so moving focus to it is expected.
  const stepKey = `${view.step}:${view.answered.length}`;
  const firstStep = useRef(stepKey);
  useEffect(() => {
    if (stepKey === firstStep.current) return;
    firstStep.current = '';
    if (view.step === 'need') {
      document.getElementById(SEARCH_INPUT_ID)?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [stepKey, view.step]);

  const finish = async (codes: string[], answered: string[]) => {
    if (requireLocation && !searchLocation) {
      setView((prev) => ({ ...prev, step: 'location' }));
      setLocationError(true);
      return;
    }
    navigate({
      taxonomies: codes,
      refined: answered,
      locationPayload: await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      ),
    });
  };

  const advance = (
    codes: string[],
    answered: string[],
    locationDone = view.locationDone,
  ) => {
    const next = { codes, answered, locationDone };
    setOtherOpen(false);
    setHistory((prev) => [...prev, view]);
    if (!query) return setView({ ...next, step: 'need' });
    const decided = decideRefine(query, codes, answered);
    // Crisis never waits behind a question: the results page opens with the crisis card.
    if (decided.kind === 'crisis') return void finish(codes, answered);
    if (!locationDone && !searchLocation) {
      return setView({ ...next, step: 'location' });
    }
    if (decided.kind !== 'question' || answered.length >= MAX_QUESTIONS) {
      return void finish(codes, answered);
    }
    setView({ ...next, step: 'question' });
  };

  const submitNeed = (event: FormEvent) => {
    event.preventDefault();
    if (!query) return setNeedError(true);
    setNeedError(false);
    advance(known(query), view.answered);
  };

  const continueLocation = () => {
    if (requireLocation && !searchLocation) return setLocationError(true);
    setLocationError(false);
    advance(view.codes, view.answered, true);
  };

  const seeResults = () => {
    if (!query) return setNeedError(true);
    void finish(
      view.step === 'need' ? known(query) : view.codes,
      view.answered,
    );
  };

  const answer = (codes: string[]) =>
    advance(codes, [...view.answered, question?.id ?? '']);

  const submitOther = () => {
    const text = other.trim();
    setOther('');
    if (!text) return setOtherOpen(false);
    const found = known(text);
    if (found.length === 0) setFlagged((prev) => [...prev, text]);
    answer([...new Set([...view.codes, ...found])]);
  };

  const back = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((prev) => prev.slice(0, -1));
    setView(previous);
  };

  return (
    <DialogPrimitive.Root
      modal={false}
      open
      onOpenChange={(next) => !next && setOpen(false)}
    >
      <DialogPrimitive.Portal>
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 z-40 bg-black/40"
          style={{ top }}
        />
        <DialogPrimitive.Content
          id={SEARCH_DIALOG_ID}
          data-testid={SEARCH_DIALOG_ID}
          data-step={view.step}
          className="fixed inset-x-0 z-50 mx-auto flex w-full flex-col gap-4 overflow-y-auto bg-white p-5 shadow-lg max-md:bottom-0 md:max-w-2xl md:rounded-b-xl"
          style={{ top, maxHeight: `calc(100dvh - ${top}px)` }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document
              .getElementById(
                focusByDefault === 'location'
                  ? LOCATION_INPUT_ID
                  : SEARCH_INPUT_ID,
              )
              ?.focus();
          }}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            Find help
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            One question at a time. You can see your results at any step.
          </DialogPrimitive.Description>

          <div className="flex items-center justify-between gap-3">
            {history.length > 0 ? (
              <button
                type="button"
                className="text-muted-foreground flex min-h-11 cursor-pointer items-center gap-1 text-sm font-medium"
                onClick={back}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                className="border-primary text-primary flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-sm font-semibold disabled:opacity-60"
                data-testid="guide-see-results"
                onClick={seeResults}
              >
                {view.step === 'question'
                  ? `See ${decision.total} ${decision.total === 1 ? 'result' : 'results'}`
                  : 'See results'}
              </button>
              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-11 cursor-pointer items-center justify-center rounded-lg"
              >
                <X className="size-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {view.step === 'need' && (
            <form onSubmit={submitNeed} className="flex flex-col gap-2">
              <SearchNeedInput
                inputId={SEARCH_INPUT_ID}
                onChange={() => setNeedError(false)}
              />
              {needError && (
                <p role="alert" className="text-destructive font-semibold">
                  Tell us what you need help with first.
                </p>
              )}
              <SearchCrisisButton />
            </form>
          )}

          {view.step === 'location' && (
            <div className="flex flex-col gap-3">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold outline-none"
              >
                Where should we look?
              </h2>
              <p>
                {requireLocation
                  ? 'We need your location to show services you can use.'
                  : 'Adding your location greatly improves your results.'}
              </p>
              <LocationSearchBar
                inputId={LOCATION_INPUT_ID}
                className="w-full"
              />
              {locationError && (
                <p
                  role="alert"
                  className="border-destructive text-destructive rounded-lg border bg-red-50 p-3 font-semibold"
                >
                  Add your location to continue. We can only show services where
                  you are.
                </p>
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="bg-primary text-primary-foreground min-h-11 cursor-pointer rounded-lg px-5 font-semibold"
                  onClick={continueLocation}
                >
                  Continue
                </button>
                {!requireLocation && (
                  <button
                    type="button"
                    className="text-muted-foreground min-h-11 cursor-pointer text-sm underline"
                    onClick={() => advance(view.codes, view.answered, true)}
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          )}

          {view.step === 'question' && question && (
            <div className="flex flex-col gap-3">
              <p className={cn('text-sm font-semibold', style.label)}>
                Question {view.answered.length + 1}
              </p>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold outline-none"
              >
                {question.text}
              </h2>
              <div className="flex flex-col gap-2">
                {question.answers.map((option: Answer) => (
                  <button
                    key={option.label}
                    type="button"
                    className={cn(
                      'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left font-medium',
                      style.button,
                    )}
                    onClick={() => answer(applyAnswer(view.codes, option))}
                  >
                    {option.label}
                    <span className="text-muted-foreground shrink-0 text-xs font-normal">
                      {option.keeps} {option.keeps === 1 ? 'result' : 'results'}
                    </span>
                  </button>
                ))}
              </div>
              {otherOpen ? (
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
                    if (event.key === 'Escape') {
                      event.stopPropagation();
                      setOtherOpen(false);
                    }
                  }}
                  className="border-control-border focus:border-primary w-full rounded-lg border bg-white px-3 py-2 text-base outline-none focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="text-primary min-h-11 cursor-pointer text-sm font-medium underline"
                    onClick={() => setOtherOpen(true)}
                  >
                    Other
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground min-h-11 cursor-pointer text-sm underline"
                    onClick={() => answer(view.codes)}
                  >
                    Skip this question
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
