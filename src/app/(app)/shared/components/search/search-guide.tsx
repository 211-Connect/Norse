'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import {
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  EmergencyBox,
  EmergencyPopup,
  emergencyPopupDismissedAtom,
  flaggedAtom,
  CARD_INFO_TEXT,
  InfoToggle,
  OptionCard,
  OptionCount,
  OtherBox,
  PICKED,
  PickMark,
  QUESTION_STYLES,
  resultCount,
  toCardQuestion,
  useAnswerPicks,
  valueOfLabel,
} from '@/app/(app)/features/search/components/search-follow-up';
import { useNavigateAiSearch } from '@/app/(app)/features/search/hooks';
import {
  emergencyQuestionOf,
  hotlinesOf,
  isSoftEmergency,
  MAX_GUIDED,
  nextQuestionOf,
  totalOf,
  useV2Navigate,
  useV2Search,
  useV2Url,
} from '@/app/(app)/features/search/v2/use-v2-search';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { useLockPageScroll } from '@/app/(app)/shared/hooks/use-lock-page-scroll';
import {
  emergencyPopupMode,
  isUrgencyAnswered,
  otherChanges,
  visibleOptions,
  withEmergencyAnswers,
} from '@/app/(app)/features/search/v2/v2-contract';
import { needDescription } from '@/app/(app)/features/search/v2/need-descriptions';

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
  userCoordinatesAtom,
} from '../../store/search';
import { LocationSearchBar } from './location-search-bar';
import { SearchNeedInput } from './search-need-form';

/** `asked` holds this id once the location step is done or put off. */
const LOCATION_STEP = 'location';

/**
 * The floating card. The header stays clear of it. Non-modal, so Quick exit and the nav still work.
 */
export function GuideShell({
  children,
  dataStep,
  focusId,
  onClose,
  onEscape,
}: {
  children: ReactNode;
  dataStep: string;
  focusId?: string;
  onClose: () => void;
  /** Return true to keep the card open on Escape (the landing page's edit mode uses it). */
  onEscape?: () => boolean;
}) {
  const [top, setTop] = useState(0);
  useLockPageScroll();
  // The dim layer starts under the header, so the logo and nav stay clear.
  useEffect(() => {
    const header = document.querySelector('header');
    setTop(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
  }, []);

  return (
    <DialogPrimitive.Root
      modal={false}
      open
      onOpenChange={(open) => !open && onClose()}
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
          data-step={dataStep}
          className="fixed left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 overflow-y-auto overscroll-contain scroll-pb-24 rounded-2xl bg-white p-5 shadow-2xl max-xl:[--exit-room:3.5rem]"
          style={{
            top: top + 24,
            // Below xl the floating Quick exit holds the bottom edge.
            maxHeight: `calc(100dvh - ${top + 48}px - var(--exit-room, 0px))`,
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (focusId) document.getElementById(focusId)?.focus();
          }}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (onEscape?.()) event.preventDefault();
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            Find help
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            One question at a time. You can see your results at any step.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-lg after:absolute after:-inset-1 after:content-['']"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The landing page's questions. The card itself is the landing popup (`GuideShell`, in
 * `search-landing.tsx`), so this is plain content inside it.
 */
function PageShell({
  children,
  dataStep,
}: {
  children: ReactNode;
  dataStep: string;
  onClose?: () => void;
}) {
  return (
    <section
      aria-label="Questions about your search"
      data-testid="landing-guide"
      data-step={dataStep}
      className="flex flex-col gap-4"
    >
      {children}
    </section>
  );
}

/** Calm placeholder for one question card: a heading bar and 3 option bars. No motion if reduced. */
export function GuideSkeleton() {
  const bar = 'rounded-lg bg-gray-200 motion-safe:animate-pulse';
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3"
      data-testid="guide-skeleton"
    >
      <div className={cn(bar, 'h-8 w-3/4')} />
      <div className="flex flex-col gap-2">
        <div className={cn(bar, 'h-12 w-full')} />
        <div className={cn(bar, 'h-12 w-full')} />
        <div className={cn(bar, 'h-12 w-full')} />
      </div>
    </div>
  );
}

/**
 * Step 1, on any page: the need box. Submitting opens the landing page (`/find?query=…`), where
 * the questions come before the results (Lucas, 2026-11-13). A deep link `/search?…&refine=1`
 * still opens these questions over the results (Q4 = A, Lucas 2026-11-11).
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
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigateAiSearch({
    setDialogOpen: setOpen,
    startTransition,
  });
  const [needError, setNeedError] = useState(false);

  useEffect(
    () => () => restoreFocusElement?.focus({ preventScroll: true }),

    [],
  );

  const submitNeed = async (event: FormEvent) => {
    event.preventDefault();
    const sent = navigate({
      landing: true,
      locationPayload: await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
      ),
    });
    setNeedError(!sent);
  };

  return (
    <GuideShell
      dataStep="need"
      focusId={
        focusByDefault === 'location' ? LOCATION_INPUT_ID : SEARCH_INPUT_ID
      }
      onClose={() => setOpen(false)}
    >
      <form
        onSubmit={submitNeed}
        className="flex flex-col gap-2 pt-8"
        aria-busy={isPending}
      >
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
    </GuideShell>
  );
}

/**
 * Steps 2 to 4, on the search page while the URL has `refine=1`. Every step comes from the URL and
 * the `/v2/search` response, so a reload, a shared link or the Back button shows the same step.
 * Order: the emergency question, then the location step, then the API's questions, at most 3 in all.
 */
export function SearchGuideFromUrl({
  placement = 'dialog',
}: {
  /**
   * `dialog` is the floating card over the results (`refine=1`). `page` is the landing page: the
   * same steps and question cards inline, and the way out is the results page, not a closed card.
   */
  placement?: 'dialog' | 'page';
} = {}) {
  const onPage = placement === 'page';
  // The count key lives in `common`; the search page's default namespace is `page-search`.
  const { t } = useTranslation('common');
  const { data, isFetching, error, query } = useV2Search();
  const { params, asked, needs, passedNeeds } = useV2Url();
  const {
    answer: writeAnswer,
    answerToResults,
    toResults,
    write,
    isPending: isWriting,
  } = useV2Navigate();
  const dismissedFor = useAtomValue(emergencyPopupDismissedAtom);
  const setDismissed = useSetAtom(emergencyPopupDismissedAtom);
  // Answers given since this page opened: Back undoes one of them (each is a history entry).
  const askedAtStart = useRef(asked.length);
  const searchLocation = useAtomValue(searchLocationAtom);
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const setFlagged = useSetAtom(flaggedAtom);
  const requireLocation = useFlag('requireUserLocation');
  const [locationError, setLocationError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The emergency comes only from the emergency question (Decision 54).
  const emergencyQ = emergencyQuestionOf(data);
  // Popup only (Lucas 2026-11-18): the red question is the full-screen popup, never a card. Each
  // answer writes urgency= and searches again; the danger popup (U-0) has Continue to results.
  const dismissed = Boolean(query) && dismissedFor === query;
  const popupMode = dismissed
    ? null
    : emergencyPopupMode(emergencyQ, params.get('urgency'), asked);
  const askedForNext = !emergencyQ
    ? asked
    : dismissed
      ? [...asked, emergencyQ.id]
      : popupMode === 'danger'
        ? asked.filter((id) => id !== emergencyQ.id)
        : asked;
  const v2 = nextQuestionOf(data, askedForNext);
  // A place already saved for this visit counts: the results page uses it, so asking for it again
  // with the same place filled in is a wasted step (Lucas UX pass, 2026-11-16).
  const hasLocation = Boolean(
    params.get('location') || params.get('coords') || searchLocation,
  );
  const locationDone = hasLocation || asked.includes(LOCATION_STEP);
  const used = asked.length;
  // The emergency question never waits behind the location step. On the landing page, an engine
  // with no question at all sends the person straight to the results, so no location step either.
  const hasQuestions = (data?.clarification.questions.length ?? 0) > 0;
  const showLocation =
    !locationDone &&
    v2?.type !== 'emergency' &&
    used < MAX_GUIDED &&
    (!onPage || hasQuestions || used > 0);
  const question =
    v2?.type === 'emergency' || (!showLocation && used < MAX_GUIDED)
      ? v2
      : undefined;
  const card = question ? toCardQuestion(question) : undefined;
  const style = card ? QUESTION_STYLES[card.type ?? 'narrow'] : undefined;
  const isEmergency = question?.type === 'emergency';
  // After a safe answer (urgency U-1 to U-4) the numbers stay in the always-on chips: the red
  // 911/988 box would flash in this card until the next answer arrives (Lucas UX walk 2026-11-19).
  const hotline =
    Boolean(emergencyQ) &&
    !popupMode &&
    !isUrgencyAnswered(params.get('urgency'));
  const hotlines = hotlinesOf(emergencyQ);
  const soft = isSoftEmergency(emergencyQ);
  const isPending = isFetching || isWriting;
  const { picks, toggle, clear } = useAnswerPicks(question?.id);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [question?.id]);
  const { shown: shownAnswers, hidden: hiddenCount } = visibleOptions(
    { type: question?.type },
    (card?.answers ?? []).map((a) => ({ ...a, value: a.value ?? a.label })),
    showAll,
  );
  const canDeferLocation = showLocation && !requireLocation;
  const canSkip = !showLocation || !requireLocation;
  // The one left button of a question step, in the row with Show results now.
  const canSkipQuestion =
    onPage && Boolean(question) && !isEmergency && picks.length === 0;
  const finished = Boolean(data) && !isPending && !showLocation && !question;
  // Lucas 2026-11-16: after Enter the card does not change until the answer is known. One status
  // line while the first answer loads (no skeleton, no buttons), then a question or the results.
  const waiting = (!data && !error) || finished;

  // With nothing left to ask, the guide closes and the results stay (the landing page goes to the
  // results). Replace, so Back skips it.
  useEffect(() => {
    if (!finished) return;
    if (onPage) toResults({}, 'replace');
    else write({ refine: null }, 'replace');
  }, [finished]);

  // A new step is an action the person took, so moving focus to it is expected.
  const stepKey = showLocation ? LOCATION_STEP : (question?.id ?? 'none');
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [stepKey]);

  // Picking a place moves on by itself and writes the place into the URL.
  const lastLocation = useRef(searchLocation);
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (!showLocation || !searchLocation) return;
    setLocationError(false);
    const coords = Array.isArray(searchCoordinates)
      ? searchCoordinates.join(',')
      : String(searchCoordinates ?? '');
    write({
      location: searchLocation,
      coords: coords || null,
      asked: [...asked, LOCATION_STEP],
    });
  }, [searchLocation]);

  if (!query || finished) return null;

  const closeGuide = () => write({ refine: null });
  // Back goes to the previous question that is not the emergency one: it steps over the emergency
  // answer's history entry, and the first question has no way back (never to the red popup).
  const emergencyId = emergencyQ?.id ?? 'emergency';
  const lastBackIdx = asked.findLastIndex(
    (id, i) => id !== emergencyId && i >= askedAtStart.current,
  );
  const canGoBack = onPage && lastBackIdx >= 0;
  const goBack = () => window.history.go(-(asked.length - lastBackIdx));
  // Skip this question: no pick. Needs offered and not picked are passed; an urgency question
  // reads as not known. The next question comes.
  const skipQuestion = () => answerQuestion([]);
  const notNow = () => write({ asked: [...asked, LOCATION_STEP] });
  const answerQuestion = (labels: string[]) => {
    if (!question) return;
    clear();
    writeAnswer(
      question,
      labels.map((l) => valueOfLabel(question, l)),
    );
  };
  // Skip on the emergency question writes no urgency (U-X counts as no answer, Decision 51).
  const skipEmergency = () => {
    if (emergencyQ) write({ asked: [...new Set([...asked, emergencyQ.id])] });
  };
  // Picks made on this step count: leaving for the results must not drop them.
  const seeResults = () => {
    if (requireLocation && !hasLocation) return setLocationError(true);
    if (onPage) {
      if (question && picks.length) {
        return answerToResults(
          question,
          picks.map((l) => valueOfLabel(question, l)),
        );
      }
      return toResults();
    }
    if (question && picks.length) {
      return writeAnswer(
        question,
        picks.map((l) => valueOfLabel(question, l)),
        { refine: null },
      );
    }
    closeGuide();
  };
  // The typed text stays in the search box, so the person can fix it. The answers go.
  const backToSearch = () => {
    write({
      refine: null,
      needs: null,
      passed_needs: null,
      urgency: null,
      asked: null,
    });
    setTimeout(() => document.getElementById(SEARCH_INPUT_ID)?.focus(), 0);
  };
  const submitOther = (text: string) => {
    if (!question) return;
    setFlagged((prev) => [...prev, text]);
    // The text joins the query (Decision 7); the picks made on this step stay.
    writeAnswer(
      question,
      picks.map((l) => valueOfLabel(question, l)),
      otherChanges(question, params.get('query'), text, {
        needs,
        passedNeeds,
        urgency: params.get('urgency'),
      }),
    );
  };

  const Shell = onPage ? PageShell : GuideShell;
  return (
    <Shell
      dataStep={showLocation ? 'location' : question ? 'question' : 'loading'}
      onClose={closeGuide}
    >
      <div
        className={cn('flex flex-col items-start gap-1', !onPage && 'pr-10')}
      >
        {!onPage && (
          <>
            <button
              type="button"
              className="text-primary -ml-1 flex min-h-11 cursor-pointer items-center gap-1 px-1 text-sm font-semibold"
              data-testid="guide-back-to-search"
              onClick={backToSearch}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to search
            </button>
            <p className="text-muted-foreground text-sm">
              Your search:{' '}
              <span className="text-foreground font-medium">
                &ldquo;{query}&rdquo;
              </span>
            </p>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="font-semibold text-red-700">
          We could not load the next question. Your results are ready.
        </p>
      )}
      {/* One calm status line for the whole wait; the skeleton keeps the card's room. */}
      <p
        role="status"
        className={cn(
          'text-muted-foreground flex items-center gap-2 text-sm',
          !(isPending || waiting) || error ? 'sr-only' : '',
        )}
        data-testid="guide-loading"
      >
        {(isPending || waiting) && !error && (
          <>
            <Loader2
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
            Looking at your search…
          </>
        )}
      </p>

      {hotline && !isEmergency && (
        <EmergencyBox hotlines={hotlines} soft={soft} />
      )}

      {emergencyQ && popupMode && (
        <EmergencyPopup
          key={query}
          mode={popupMode}
          question={withEmergencyAnswers(emergencyQ)}
          hotlines={hotlines}
          busy={isPending}
          onAnswer={(value) => {
            const q = withEmergencyAnswers(emergencyQ);
            writeAnswer(q, [value]);
          }}
          onContinue={() => {
            setDismissed(query);
            if (onPage) toResults();
          }}
        />
      )}

      {card && isEmergency && question && !popupMode && (
        <>
          <h2 ref={headingRef} tabIndex={-1} className="sr-only">
            {card.text}
          </h2>
          <EmergencyBox
            question={soft ? card : undefined}
            hotlines={hotlines}
            soft={soft}
            onAnswer={(option) => answerQuestion([option.label])}
            onSkip={soft ? skipEmergency : undefined}
          />
        </>
      )}

      {data && (showLocation || (card && !isEmergency)) && (
        <div className="relative" data-testid="guide-step-body">
          {data && isPending && (
            <div className="absolute inset-0 z-10 bg-white">
              <GuideSkeleton />
            </div>
          )}
          <div
            className={cn(
              'flex flex-col gap-4',
              data && isPending && 'invisible',
            )}
            // The old question cannot be clicked or tabbed to while the next one loads.
            inert={data && isPending ? true : undefined}
          >
            {showLocation && (
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
                    className="border-red-700 text-red-700 rounded-lg border bg-red-50 p-3 font-semibold"
                  >
                    Add your location to continue. We can only show services
                    where you are.
                  </p>
                )}
              </div>
            )}

            {card && !isEmergency && style && question && (
              <div className="flex flex-col gap-3" aria-busy={isPending}>
                <div className="flex items-start gap-2">
                  {canGoBack && (
                    <button
                      type="button"
                      aria-label="Previous question"
                      className="text-primary hover:bg-primary/10 -ml-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full"
                      data-testid="guide-back"
                      onClick={goBack}
                    >
                      <ArrowLeft className="size-5" aria-hidden="true" />
                    </button>
                  )}
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-2">
                    <div className="min-w-0 flex-1">
                      <h2
                        ref={headingRef}
                        id="guide-question"
                        aria-describedby={card.multi ? 'guide-hint' : undefined}
                        tabIndex={-1}
                        className="text-2xl font-semibold outline-none"
                      >
                        {card.text}
                      </h2>
                      {card.multi && (
                        <p id="guide-hint" className="text-muted-foreground">
                          Pick all that fit.
                        </p>
                      )}
                    </div>
                    <InfoToggle
                      key={question.id}
                      label="More about this question"
                      testId="question-info"
                      className="-mt-1"
                    >
                      {CARD_INFO_TEXT}
                    </InfoToggle>
                  </div>
                </div>
                <div
                  role="group"
                  aria-labelledby="guide-question"
                  className="flex flex-col gap-2"
                >
                  {shownAnswers.map((option) => {
                    const on = picks.includes(option.label);
                    return (
                      <OptionCard
                        key={option.label}
                        description={needDescription(option.add[0])}
                      >
                        <button
                          type="button"
                          disabled={isPending}
                          aria-pressed={card.multi ? on : undefined}
                          className={cn(
                            'group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border py-2 pr-12 pl-4 text-left font-medium disabled:opacity-60',
                            style.button,
                            on && PICKED,
                          )}
                          onClick={() =>
                            card.multi
                              ? toggle(option.label)
                              : answerQuestion([option.label])
                          }
                        >
                          {card.multi && <PickMark on={on} />}
                          <span className="flex flex-1 flex-col">
                            {option.label}
                            <OptionCount count={option.keeps} />
                          </span>
                        </button>
                      </OptionCard>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      className="text-primary min-h-11 cursor-pointer self-start px-1 font-semibold underline"
                      data-testid="show-more-options"
                      onClick={() => setShowAll(true)}
                    >
                      Show more ({hiddenCount})
                    </button>
                  )}
                  {question.allow_other && (
                    <OtherBox
                      key={question.id}
                      placeholder="Other: type your own"
                      onSubmit={submitOther}
                    />
                  )}
                  <p className="sr-only" role="status">
                    {picks.length > 0 ? `${picks.length} picked.` : ''}
                  </p>
                  {picks.length > 0 ? (
                    <button
                      type="button"
                      disabled={isPending}
                      className="bg-primary text-primary-foreground min-h-12 cursor-pointer rounded-lg px-5 font-semibold disabled:opacity-60"
                      data-testid="guide-continue"
                      onClick={() => answerQuestion(picks)}
                    >
                      Continue
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {data && (
        <p className="sr-only" role="status" data-testid="guide-results-count">
          {resultCount(totalOf(data))} found so far.
        </p>
      )}

      {!waiting && (canSkip || canDeferLocation || onPage) && (
        <div
          className={cn(
            'flex min-h-11 flex-wrap items-center justify-between gap-3',
            // Both placements sit in the scrolling guide dialog (p-5). The actions stay in view: on a
            // 390x700 phone "Show results now" sat 211 px below the fold (UX pass 2026-11-16).
            // -bottom-5 covers the dialog's own bottom padding, so no content shows under the row.
            'sticky -bottom-5 z-10 -mx-5 -mb-5 border-t bg-white px-5 py-3 max-sm:flex-nowrap max-sm:gap-2',
          )}
        >
          {canSkipQuestion && (
            <button
              type="button"
              disabled={isPending}
              className="border-control-border min-h-11 shrink-0 cursor-pointer rounded-lg border bg-white px-5 font-semibold disabled:opacity-60 max-sm:px-4"
              data-testid="guide-skip-question"
              onClick={skipQuestion}
            >
              Skip question
            </button>
          )}
          {canDeferLocation && (
            <button
              type="button"
              className="border-primary text-primary min-h-11 cursor-pointer rounded-lg border bg-white px-5 font-semibold"
              data-testid="guide-location-not-now"
              onClick={notNow}
            >
              Not now
            </button>
          )}
          {(canSkip || onPage) && (
            <button
              type="button"
              disabled={isWriting}
              className={cn(
                'ml-auto min-h-11 cursor-pointer rounded-lg px-5 font-semibold disabled:opacity-60 max-sm:px-3',
                picks.length > 0
                  ? 'border-primary text-primary border bg-white'
                  : 'bg-primary text-primary-foreground',
              )}
              data-testid="guide-see-results"
              onClick={seeResults}
            >
              {onPage
                ? 'Show results now'
                : data
                  ? `Skip to results (${totalOf(data)})`
                  : 'Skip to results'}
            </button>
          )}
        </div>
      )}
    </Shell>
  );
}

/** The search page mounts this: the guide shows only while the URL asks for it. */
export function SearchGuideWhenRefining() {
  const { refine } = useV2Url();
  return refine ? <SearchGuideFromUrl /> : null;
}
