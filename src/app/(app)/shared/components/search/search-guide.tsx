'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState, useTransition } from 'react';

import {
  flaggedAtom,
  LEVELS,
  OtherBox,
} from '@/app/(app)/features/search/components/search-follow-up';
import { useNavigateAiSearch } from '@/app/(app)/features/search/hooks';
import {
  applyAnswer,
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

  // Picking a place moves on by itself, so the card needs only Skip and See results.
  const lastLocation = useRef(searchLocation);
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (step === 'location' && searchLocation) leaveLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLocation]);

  const seeResults = () => void finish(steps ? codes : known(query), answered);

  const skip = () => {
    if (step === 'location') return leaveLocation();
    if (question) next(codes, [...answered, question.id]);
  };

  const pick = (nextCodes: string[]) => {
    if (question) next(nextCodes, [...answered, question.id]);
  };

  const submitOther = (text: string) => {
    const found = known(text);
    if (found.length === 0) setFlagged((prev) => [...prev, text]);
    pick([...new Set([...codes, ...found])]);
  };

  const canSkip = step === 'location' ? !requireLocation : Boolean(question);

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
          className="fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
          style={{ top: top + 24, maxHeight: `calc(100dvh - ${top + 48}px)` }}
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
                <p role="alert" className="text-destructive font-semibold">
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
            </div>
          )}

          {question && style && (
            <div className="flex flex-col gap-3">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl font-semibold outline-none"
              >
                {question.text}
              </h2>
              <div className="flex flex-col gap-2">
                {question.answers.map((option) => {
                  const applied = applyAnswer(codes, option) as string[];
                  const keeps = matchServices(applied).length;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left font-medium',
                        style.button,
                      )}
                      onClick={() => pick(applied)}
                    >
                      {option.label}
                      <span className="text-muted-foreground shrink-0 text-xs font-normal">
                        {keeps} {keeps === 1 ? 'result' : 'results'}
                      </span>
                    </button>
                  );
                })}
                <OtherBox
                  key={question.id}
                  placeholder="Other: type your own"
                  onSubmit={submitOther}
                />
              </div>
            </div>
          )}

          {(canSkip || query) && (
            <div className="flex min-h-11 items-center justify-between gap-3">
              {canSkip ? (
                <button
                  type="button"
                  className="text-muted-foreground min-h-11 cursor-pointer px-1 font-medium underline"
                  data-testid="guide-skip"
                  onClick={skip}
                >
                  Skip
                </button>
              ) : (
                <span />
              )}
              {query && (
                <button
                  type="button"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground min-h-11 cursor-pointer rounded-lg px-5 font-semibold disabled:opacity-60"
                  data-testid="guide-see-results"
                  onClick={seeResults}
                >
                  See results
                </button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
