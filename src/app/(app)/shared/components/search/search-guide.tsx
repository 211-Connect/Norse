'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import {
  FormEvent,
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useTranslation } from 'react-i18next';

import { EmergencyBox } from '@/app/(app)/features/search/components/emergency-box';
import {
  EmergencyPopup,
  emergencyPopupDismissedAtom,
  flaggedAtom,
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
  canonicalType,
  guideQuestionOf,
  totalOf,
  useV2Navigate,
  useV2Search,
  useV2Url,
} from '@/app/(app)/features/search/v2/use-v2-search';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import { searchGuideOpenAtom } from '@/app/(app)/shared/store/dialogs';
import { useLockPageScroll } from '@/app/(app)/shared/hooks/use-lock-page-scroll';
import {
  canGoBackFrom,
  hasSavedLocation,
  keepsGuideOpen,
  asksLocationStep,
  MIN_PLACE_LOADING_MS,
  showBottomBar,
} from '@/app/(app)/features/search/v2/guide-rules';
import {
  CLEAR_LOCATION_CHANGES,
  isPickedPlace,
} from '@/app/(app)/features/search/v2/landing';
import { isEverywhereLocation } from '@/app/(app)/shared/lib/search-utils';
import {
  emergencyPopupMode,
  isUrgencyAnswered,
  otherChanges,
  type V2Changes,
  visibleOptions,
  withEmergencyAnswers,
} from '@/app/(app)/features/search/v2/v2-contract';

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
  searchRegionAtom,
  userCoordinatesAtom,
} from '../../store/search';
import { LocationSearchBar } from './location-search-bar';
import { SearchNeedInput } from './search-need-form';

/** `asked` holds this id once the location step is done or put off. */
const LOCATION_STEP = 'location';

/** The card scrolls as a whole (the default). */
const CARD_SCROLL_CLASS = 'overflow-y-auto overscroll-contain scroll-pb-24';
/** `innerScroll`: the card itself never scrolls; a child with `min-h-0 flex-1 overflow-y-auto` does. */
const CARD_INNER_SCROLL_CLASS = 'overflow-hidden';

/**
 * The floating card. The header stays clear of it. Non-modal, so Quick exit and the nav still work.
 */
export function GuideShell({
  children,
  dataStep,
  focusId,
  onClose,
  onEscape,
  innerScroll = false,
}: {
  children: ReactNode;
  dataStep: string;
  focusId?: string;
  onClose: () => void;
  /** Return true to keep the card open on Escape (the landing page's edit mode uses it). */
  onEscape?: () => boolean;
  /**
   * The card keeps its header and bottom bar in place: it does not scroll, and the page marks one
   * child as the scroll region. The default scrolls the whole card.
   */
  innerScroll?: boolean;
}) {
  const [top, setTop] = useState(0);
  useLockPageScroll();
  const setGuideOpen = useSetAtom(searchGuideOpenAtom);
  useEffect(() => {
    setGuideOpen(true);
    return () => setGuideOpen(false);
  }, [setGuideOpen]);
  // The dim layer starts under the header, so the logo and nav stay clear (wider than sm).
  useEffect(() => {
    const header = document.querySelector('header');
    setTop(Math.max(0, header?.getBoundingClientRect().bottom ?? 0));
  }, []);

  return (
    <Dialog modal={false} open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 z-40 bg-black/40 max-sm:hidden"
          style={{ top }}
        />
      </DialogPortal>
      {/* The page stays usable behind it (modal off), so no overlay and no centered-card classes. */}
      <DialogContent
        bare
        overlay={false}
        withClose={false}
        aria-modal="false"
        id={SEARCH_DIALOG_ID}
        data-testid={SEARCH_DIALOG_ID}
        data-step={dataStep}
        className={cn(
          'fixed top-[calc(var(--guide-top)+12px)] left-1/2 z-50 flex max-h-[calc(100dvh-var(--guide-top)-24px-var(--exit-room,0px))] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl max-xl:[--exit-room:3.5rem] max-sm:[--exit-room:0px] max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:rounded-none max-sm:pt-[4.25rem] max-sm:pb-[calc(1.25rem+var(--exit-room))] max-sm:shadow-none',
          innerScroll ? CARD_INNER_SCROLL_CLASS : CARD_SCROLL_CLASS,
        )}
        style={
          {
            // Below xl the floating Quick exit holds the bottom edge.
            // Below sm the card fills the screen: no header, no page behind.
            '--guide-top': `${top}px`,
          } as CSSProperties
        }
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (focusId) document.getElementById(focusId)?.focus();
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // The header (menu button, nav) and the menu panel it opens are not "outside" the
        // questions: using them keeps /find open (Lucas, 2026-11-20).
        onInteractOutside={(event) => {
          if (keepsGuideOpen(event.target)) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (onEscape?.()) event.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Find help</DialogTitle>
        <DialogDescription className="sr-only">
          One question at a time. You can see your results at any step.
        </DialogDescription>
        {/* Phone top bar: Back (top left, closes the layer) and the floating Quick exit (top
              right, quick-exit-button.tsx), a divider under both so the 911/988 chips stay apart. */}
        <div
          aria-hidden="true"
          data-testid="guide-top-bar"
          className="fixed inset-x-0 top-0 z-[55] h-[3.25rem] border-b border-gray-200 bg-white sm:hidden"
        />
        <DialogClose
          data-testid="guide-close"
          className="absolute top-4 right-4 flex size-9 cursor-pointer items-center justify-center rounded-lg after:absolute after:-inset-1 after:content-[''] max-sm:fixed max-sm:top-2 max-sm:right-auto max-sm:left-2 max-sm:z-[56] max-sm:h-11 max-sm:w-auto max-sm:min-w-11 max-sm:gap-1 max-sm:px-3 max-sm:text-sm max-sm:font-semibold"
        >
          <X className="size-5 max-sm:hidden" aria-hidden="true" />
          <ArrowLeft className="size-5 sm:hidden" aria-hidden="true" />
          <span className="sr-only max-sm:hidden">Close</span>
          <span className="sm:hidden">Back</span>
        </DialogClose>
        {children}
      </DialogContent>
    </Dialog>
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
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      {children}
    </section>
  );
}

/**
 * On the landing page the questions scroll in this region while the bottom bar stays below it.
 * In the dialog the whole card scrolls, so the children go straight in.
 */
function GuideRegion({
  onPage,
  children,
}: {
  onPage: boolean;
  children: ReactNode;
}) {
  if (!onPage) return <>{children}</>;
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
      data-testid="guide-scroll"
    >
      {children}
    </div>
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
      locationPayload: buildSearchLocationPayload(
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
  const skipToResults = t('v2_skip_to_results', 'Skip to results');
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
  const searchRegion = useAtomValue(searchRegionAtom);
  const setFlagged = useSetAtom(flaggedAtom);
  const requireLocation = useFlag('requireUserLocation');
  const [locationError, setLocationError] = useState(false);
  // A place was just picked: the card shows its loading state for a moment before it moves on.
  const [placeSaving, setPlaceSaving] = useState(false);
  const placeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(placeTimer.current), []);
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
  const guideNext = guideQuestionOf(data, asked, askedForNext);
  // A soft emergency question always shows its three answers (the red popup is unchanged).
  const v2 =
    guideNext &&
    canonicalType(guideNext.type) === 'emergency' &&
    isSoftEmergency(guideNext)
      ? withEmergencyAnswers(guideNext)
      : guideNext;
  // A place already saved for this visit counts: the results page uses it, so asking for it again
  // with the same place filled in is a wasted step (Lucas UX pass, 2026-11-16).
  const hasLocation = hasSavedLocation({
    urlLocation: params.get('location'),
    urlCoords: params.get('coords'),
    searchLocation,
    searchCoordinates,
    searchRegion,
  });
  const locationDone = hasLocation || asked.includes(LOCATION_STEP);
  const used = new Set(asked).size;
  // The emergency question never waits behind the location step. On the landing page, an engine
  // with no question at all sends the person straight to the results, so no location step either.
  const hasQuestions = (data?.clarification.questions.length ?? 0) > 0;
  // While a picked place is saved (placeSaving), the step stays, with its loading state: the picked
  // place already counts as saved, which would hide the step at once (live walk 2026-11-20).
  const showLocation =
    placeSaving ||
    asksLocationStep({
      locationDone,
      isEmergency: v2 ? canonicalType(v2.type) === 'emergency' : false,
      used,
      onPage,
      hasQuestions,
      requireLocation,
    });
  // The guide asks at most GUIDE_LIMIT steps (guideQuestionOf); the API gets no `asked`.
  const question =
    v2 && (canonicalType(v2.type) === 'emergency' || !showLocation)
      ? v2
      : undefined;
  const card = question ? toCardQuestion(question) : undefined;
  const style = card ? QUESTION_STYLES[card.type ?? 'subtle'] : undefined;
  const isEmergency = question
    ? canonicalType(question.type) === 'emergency'
    : false;
  // After a safe answer (urgency U-1 to U-4) the numbers stay in the always-on chips: the red
  // 911/988 box would flash in this card until the next answer arrives (Lucas UX walk 2026-11-19).
  const hotline =
    Boolean(emergencyQ) &&
    !popupMode &&
    !isUrgencyAnswered(params.get('urgency'));
  const hotlines = hotlinesOf(emergencyQ);
  const soft = isSoftEmergency(emergencyQ);
  const isPending = isFetching || isWriting;
  // `placeSaving` (a picked place is being saved) looks like loading, so the card does not jump.
  const busy = isPending || placeSaving;
  const { picks, toggle, clear } = useAnswerPicks(question?.id);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setShowAll(false), [question?.id]);
  const { shown: shownAnswers, hidden: hiddenCount } = visibleOptions(
    { placement: question?.placement },
    (card?.answers ?? []).map((a) => ({ ...a, value: a.value ?? a.label })),
    showAll,
  );
  const canDeferLocation = showLocation && !requireLocation;
  const canSkip = !showLocation || !requireLocation;
  // The one left button of a question step, in the row with Show results now.
  const canSkipQuestion =
    onPage && Boolean(question) && !isEmergency && picks.length === 0;
  // The bottom bar: Skip question + Show results now, or Continue once something is picked.
  const showBar = canSkip || canDeferLocation || onPage || picks.length > 0;
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

  // Picking a place moves on by itself and writes the place into the URL. Only a real pick counts
  // (a point or an area, or Everywhere): typed letters, or Enter before the lookup is back, write
  // nothing (live walk 2026-11-20: Enter on "Syracuse" saved the raw text and jumped ahead).
  const lastLocation = useRef(searchLocation);
  // The step as the person saw it before this render: a pick also makes the place count as saved,
  // so `showLocation` is already false in the render that carries the pick.
  const wasShowingLocation = useRef(showLocation);
  useEffect(() => {
    if (lastLocation.current === searchLocation) return;
    lastLocation.current = searchLocation;
    if (!wasShowingLocation.current || !searchLocation) return;
    const everywhere = isEverywhereLocation(searchLocation);
    if (!everywhere && !isPickedPlace(searchCoordinates, searchRegion)) return;
    setLocationError(false);
    const coords = Array.isArray(searchCoordinates)
      ? searchCoordinates.join(',')
      : String(searchCoordinates ?? '');
    const changes: V2Changes = everywhere
      ? { ...CLEAR_LOCATION_CHANGES, asked: [...asked, LOCATION_STEP] }
      : {
          location: searchLocation,
          coords: coords || null,
          region: searchRegion || null,
          asked: [...asked, LOCATION_STEP],
        };
    setPlaceSaving(true);
    clearTimeout(placeTimer.current);
    placeTimer.current = setTimeout(() => {
      write(changes);
      setPlaceSaving(false);
    }, MIN_PLACE_LOADING_MS);
  }, [searchLocation]);
  // Runs after the pick effect above, so that effect still sees the previous render's step.
  useEffect(() => {
    wasShowingLocation.current = showLocation;
  });

  if (!query || finished) return null;

  const closeGuide = () => write({ refine: null });
  // Back goes to the previous question that is not the emergency one: it steps over the emergency
  // answer's history entry, and the first question has no way back (never to the red popup).
  const emergencyId = emergencyQ?.id ?? 'emergency';
  const lastBackIdx = asked.findLastIndex(
    (id, i) => id !== emergencyId && i >= askedAtStart.current,
  );
  const canGoBack = canGoBackFrom({
    onPage,
    // A dismissed crisis popup counts as the step before (askedForNext adds it).
    asked: askedForNext,
    lastBackIdx,
    locationStep: LOCATION_STEP,
    emergencyId,
  });
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
      otherChanges(question, params.get('query'), text, { needs, passedNeeds }),
    );
  };

  const Shell = onPage ? PageShell : GuideShell;
  return (
    <Shell
      dataStep={showLocation ? 'location' : question ? 'question' : 'loading'}
      onClose={closeGuide}
    >
      <GuideRegion onPage={onPage}>
        <div
          className={cn('flex flex-col items-start gap-1', !onPage && 'pr-10')}
        >
          {!onPage && (
            <>
              <Button
                variant="link"
                type="button"
                className="-ml-1 h-auto min-h-11 gap-1 px-1 text-sm font-semibold no-underline"
                data-testid="guide-back-to-search"
                onClick={backToSearch}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to search
              </Button>
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
            We could not load the next question.
          </p>
        )}
        {/* One calm status line for the whole wait; the skeleton keeps the card's room. */}
        <p
          role="status"
          className={cn(
            'text-muted-foreground flex items-center gap-2 text-sm',
            !(busy || waiting) || error ? 'sr-only' : '',
          )}
          data-testid="guide-loading"
        >
          {(busy || waiting) && !error && (
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
            {data && busy && (
              <div className="absolute inset-0 z-10 bg-white">
                <GuideSkeleton />
              </div>
            )}
            <div
              className={cn('flex flex-col gap-4', data && busy && 'invisible')}
              // The old question cannot be clicked or tabbed to while the next one loads.
              inert={data && busy ? true : undefined}
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
                  {requireLocation && (
                    <p>We need your location to show services you can use.</p>
                  )}
                  <LocationSearchBar
                    inputId={LOCATION_INPUT_ID}
                    listClassName="z-30 rounded-md border border-gray-300 shadow-lg"
                    myLocationInline
                    anchorList="input"
                    commitAfterLoad
                    rankEverywhere
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
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Previous question"
                        className="text-primary hover:bg-primary/10 -ml-2 size-9 shrink-0 rounded-full"
                        data-testid="guide-back"
                        onClick={goBack}
                      >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                      </Button>
                    )}
                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-2">
                      <div className="min-w-0 flex-1">
                        <h2
                          ref={headingRef}
                          id="guide-question"
                          aria-describedby={
                            card.multi ? 'guide-hint' : undefined
                          }
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
                          description={option.description}
                          className={cn(style.button, on && PICKED)}
                        >
                          <button
                            type="button"
                            disabled={isPending}
                            aria-pressed={card.multi ? on : undefined}
                            className={cn(
                              'group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg bg-transparent py-2 pr-12 pl-4 text-left font-medium disabled:opacity-60',
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
                      <Button
                        variant="link"
                        type="button"
                        className="h-auto min-h-11 self-start px-1 text-base font-semibold underline"
                        data-testid="show-more-options"
                        onClick={() => setShowAll(true)}
                      >
                        Show more ({hiddenCount})
                      </Button>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {data && (
          <p
            className="sr-only"
            role="status"
            data-testid="guide-results-count"
          >
            {resultCount(totalOf(data))} found so far.
          </p>
        )}
      </GuideRegion>

      {showBottomBar({ waiting, showBar, isPending, placeSaving }) && (
        <div
          className={cn(
            'flex min-h-11 flex-wrap items-center justify-between gap-3',
            // On the page the bar is the card's last row, outside the scroll region: it needs no sticky.
            // In the scrolling dialog (p-5) it sticks to the bottom so the actions stay in view (a
            // 390x700 phone had "Show results now" 211 px below the fold, UX pass 2026-11-16);
            // -bottom-5 covers the dialog's own bottom padding.
            onPage
              ? 'shrink-0 -mx-5 border-t bg-white px-5 pt-3 max-sm:flex-nowrap max-sm:gap-2'
              : 'sticky -bottom-5 z-10 -mx-5 -mb-5 border-t bg-white px-5 py-3 max-sm:flex-nowrap max-sm:gap-2 max-sm:-bottom-[calc(1.25rem+var(--exit-room))] max-sm:-mb-[calc(1.25rem+var(--exit-room))] max-sm:pb-[calc(0.75rem+var(--exit-room))]',
          )}
        >
          {canSkipQuestion && (
            <Button
              variant="outline"
              type="button"
              disabled={isPending}
              className="border-control-border h-auto min-h-11 shrink-0 rounded-lg bg-white px-5 text-base font-semibold max-sm:px-4"
              data-testid="guide-skip-question"
              onClick={skipQuestion}
            >
              Skip question
            </Button>
          )}
          {canDeferLocation && (
            <Button
              variant="highlight"
              type="button"
              className="h-auto min-h-11 rounded-lg bg-white px-5 text-base font-semibold"
              data-testid="guide-location-not-now"
              onClick={notNow}
            >
              Not now
            </Button>
          )}
          {picks.length > 0 && question && (
            // One Continue, in the bar: it takes the place of Skip question and Show results now
            // while at least one option is picked (Lucas 2026-11-19).
            <Button
              type="button"
              disabled={isPending}
              className="h-auto min-h-11 w-full rounded-lg px-5 text-base font-semibold"
              data-testid="guide-continue"
              onClick={() => answerQuestion(picks)}
            >
              Continue
            </Button>
          )}
          {(canSkip || onPage) && picks.length === 0 && (
            <Button
              type="button"
              disabled={isWriting}
              className="ml-auto h-auto min-h-11 rounded-lg px-5 text-base font-semibold max-sm:px-3"
              data-testid="guide-see-results"
              onClick={seeResults}
            >
              {onPage
                ? 'Show results now'
                : data
                  ? `${skipToResults} (${totalOf(data)})`
                  : skipToResults}
            </Button>
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
