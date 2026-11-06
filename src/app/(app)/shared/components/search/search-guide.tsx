'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';

import {
  flaggedAtom,
  LEVELS,
  OtherBox,
  PICKED,
  PickMark,
  PicksStatus,
  resultCount,
  useAnswerPicks,
} from '@/app/(app)/features/search/components/search-follow-up';
import { useNavigateAiSearch } from '@/app/(app)/features/search/hooks';
import {
  applyAnswer,
  applyAnswers,
  classifySune,
  decideRefine,
  lookup,
  matchServices,
  planQuestions,
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
import { SearchNeedInput } from './search-need-form';

/** More steps than this tires people out; the rest wait on the results page. */
const MAX_STEPS = 3;

type Answer = { label: string; add: string[]; remove?: string[] };
type Question = {
  id: string;
  level: keyof typeof LEVELS;
  text: string;
  multi?: boolean;
  answers: Answer[];
};
type Step = 'location' | Question;

const known = (text: string) =>
  (classifySune(text).codes as string[]).filter(
    (code) => code !== 'U-X' && lookup(code),
  );

/**
 * Prototype: one question at a time in a floating card. The header stays clear of it.
 * Non-modal, so Quick exit and the nav still work. The step list is fixed once the
 * need is known, so an answer never changes how many questions are left.
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

  // Null steps means the need box shows. A lone 'location' opens from the location link.
  const [steps, setSteps] = useState<Step[] | null>(
    focusByDefault === 'location' ? ['location'] : null,
  );
  const [at, setAt] = useState(0);
  const [codes, setCodes] = useState<string[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [locationDone, setLocationDone] = useState(false);
  const [needError, setNeedError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [top, setTop] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const query = searchTerm.trim();
  const step = steps?.[at];
  const question = step && step !== 'location' ? step : undefined;
  const style = question ? LEVELS[question.level] : undefined;
  const { picks, toggle } = useAnswerPicks(question?.id);
  const chosen = (question?.answers ?? []).filter((answer) =>
    picks.includes(answer.label),
  );
  const withPicks = applyAnswers(codes, chosen) as string[];
  // A required location step offers neither: both could only end in an error.
  const canDeferLocation = step === 'location' && !requireLocation;
  const canSkip = Boolean(query) && (step !== 'location' || !requireLocation);

  // The dim layer starts under the header, so the logo and nav stay clear.
  useEffect(() => {
    const header = document.querySelector('header');
    setTop(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
    return () => restoreFocusElement?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new step is an action the person took, so moving focus to it is expected.
  const stepKey = steps ? `step:${at}` : 'need';
  const firstStep = useRef(stepKey);
  useEffect(() => {
    if (stepKey === firstStep.current) return;
    firstStep.current = '';
    if (stepKey === 'need') document.getElementById(SEARCH_INPUT_ID)?.focus();
    else headingRef.current?.focus();
  }, [stepKey]);

  const finish = async (finalCodes: string[], finalAnswered: string[]) => {
    if (requireLocation && !searchLocation) {
      setSteps(['location']);
      setAt(0);
      setLocationError(true);
      return;
    }
    navigate({
      taxonomies: finalCodes,
      refined: finalAnswered,
      locationPayload: await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      ),
    });
  };

  const plan = (needCodes: string[], hasLocation: boolean) => {
    // Crisis never waits behind a question: the results page opens with the crisis card.
    if (decideRefine(query, needCodes, []).kind === 'crisis') {
      return void finish(needCodes, []);
    }
    const location: Step[] = hasLocation ? [] : ['location'];
    const list = [
      ...location,
      ...(planQuestions(
        query,
        needCodes,
        MAX_STEPS - location.length,
      ) as Question[]),
    ];
    if (list.length === 0) return void finish(needCodes, []);
    setCodes(needCodes);
    setSteps(list);
    setAt(0);
  };

  const next = (nextCodes: string[], nextAnswered: string[]) => {
    setCodes(nextCodes);
    setAnswered(nextAnswered);
    // Crisis never waits behind a question, however it was typed.
    if (nextCodes.includes('U-0')) return void finish(nextCodes, nextAnswered);
    if (steps && at + 1 < steps.length) return setAt(at + 1);
    void finish(nextCodes, nextAnswered);
  };

  const submitNeed = (event: FormEvent) => {
    event.preventDefault();
    if (!query) return setNeedError(true);
    setNeedError(false);
    plan(known(query), locationDone || Boolean(searchLocation));
  };

  const leaveLocation = () => {
    setLocationDone(true);
    setLocationError(false);
    // Opened from the location link, or sent back here: the need comes next.
    if (steps?.length === 1 && codes.length === 0) {
      if (!query) return setSteps(null);
      return plan(known(query), true);
    }
    next(codes, answered);
  };

  // Picking a place moves on by itself. "Not now" moves on without one.
  const lastLocation = useRef(searchLocation);
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (step === 'location' && searchLocation) leaveLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  // Picks made on this step count: leaving for the results must not drop them.
  const seeResults = () =>
    void finish(
      steps ? withPicks : known(query),
      question && picks.length ? [...answered, question.id] : answered,
    );

  const pick = (nextCodes: string[]) => {
    if (question) next(nextCodes, [...answered, question.id]);
  };

  const submitOther = (text: string) => {
    const found = known(text);
    if (found.length === 0) setFlagged((prev) => [...prev, text]);
    pick([...new Set([...withPicks, ...found])]);
  };

  return (
    <DialogPrimitive.Root
      modal={false}
      open
      onOpenChange={(open) => !open && setOpen(false)}
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
          data-step={question ? 'question' : (step ?? 'need')}
          className="fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl max-xl:[--exit-room:3.5rem]"
          style={{
            top: top + 24,
            // Below xl the floating Quick exit holds the bottom edge.
            maxHeight: `calc(100dvh - ${top + 48}px - var(--exit-room, 0px))`,
          }}
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
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-lg"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          {!steps && (
            <form onSubmit={submitNeed} className="flex flex-col gap-2 pt-8">
              <SearchNeedInput
                inputId={SEARCH_INPUT_ID}
                onChange={() => setNeedError(false)}
              />
              {needError && (
                <p role="alert" className="text-red-700 font-semibold">
                  Tell us what you need help with first.
                </p>
              )}
            </form>
          )}

          {steps && (
            <div className="flex flex-col gap-1 pr-10">
              {query && (
                <p className="text-muted-foreground text-sm">
                  Your search:{' '}
                  <span className="text-foreground font-medium">
                    &ldquo;{query}&rdquo;
                  </span>
                </p>
              )}
              {steps.length > 1 || question ? (
                <p
                  className={cn(
                    'text-sm font-semibold',
                    style?.label ?? 'text-primary',
                  )}
                  data-testid="guide-progress"
                  id="guide-progress"
                >
                  Question {at + 1} of {steps.length}
                </p>
              ) : null}
            </div>
          )}

          {step === 'location' && (
            <div className="flex flex-col gap-3">
              <h2
                ref={headingRef}
                aria-describedby="guide-progress"
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
                  className="border-red-700 text-red-700 rounded-lg border bg-red-50 p-3 font-semibold"
                >
                  Add your location to continue. We can only show services where
                  you are.
                </p>
              )}
            </div>
          )}

          {question && style && (
            <div className="flex flex-col gap-3">
              <div>
                <h2
                  ref={headingRef}
                  id="guide-question"
                  aria-describedby={cn(
                    'guide-progress',
                    question.multi && 'guide-hint',
                  )}
                  tabIndex={-1}
                  className="text-2xl font-semibold outline-none"
                >
                  {question.text}
                </h2>
                {question.multi && (
                  <p id="guide-hint" className="text-muted-foreground">
                    Pick all that fit.
                  </p>
                )}
              </div>
              <div
                role="group"
                aria-labelledby="guide-question"
                className="flex flex-col gap-2"
              >
                {question.answers.map((option) => {
                  const applied = applyAnswer(codes, option) as string[];
                  const on = picks.includes(option.label);
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={question.multi ? on : undefined}
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-left font-medium',
                        !question.multi && 'justify-between',
                        style.button,
                        on && PICKED,
                      )}
                      onClick={() =>
                        question.multi ? toggle(option.label) : pick(applied)
                      }
                    >
                      {question.multi && <PickMark on={on} />}
                      {option.label}
                      {!question.multi && (
                        <span className="text-muted-foreground shrink-0 text-xs font-normal">
                          {resultCount(matchServices(applied).length)}
                        </span>
                      )}
                    </button>
                  );
                })}
                <OtherBox
                  key={question.id}
                  placeholder="Other: type your own"
                  onSubmit={submitOther}
                />
                <PicksStatus
                  count={picks.length}
                  total={matchServices(withPicks).length}
                />
                {picks.length > 0 && (
                  <button
                    type="button"
                    className="bg-primary text-primary-foreground min-h-12 cursor-pointer rounded-lg px-5 font-semibold"
                    data-testid="guide-continue"
                    onClick={() => pick(withPicks)}
                  >
                    Continue: {resultCount(matchServices(withPicks).length)}
                  </button>
                )}
              </div>
            </div>
          )}

          {(canSkip || canDeferLocation) && (
            <div className="flex min-h-11 items-center justify-between gap-3">
              {canDeferLocation && (
                <button
                  type="button"
                  className="border-primary text-primary min-h-11 cursor-pointer rounded-lg border bg-white px-5 font-semibold"
                  data-testid="guide-location-not-now"
                  onClick={leaveLocation}
                >
                  Not now
                </button>
              )}
              {canSkip && (
                <button
                  type="button"
                  disabled={isPending}
                  className={cn(
                    'ml-auto min-h-11 cursor-pointer rounded-lg px-5 font-semibold disabled:opacity-60',
                    picks.length > 0
                      ? 'border-primary text-primary border bg-white'
                      : 'bg-primary text-primary-foreground',
                  )}
                  data-testid="guide-see-results"
                  onClick={seeResults}
                >
                  Skip to results
                </button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
