// Prototype search UX polish (Lucas, 2026-11-14): emergency dialing, suggestions, the compact bar,
// the dropped progress label, and the results-page new-search fix.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { appConfigContext } from '../src/app/(app)/shared/context/app-config-context';
import { buildSearchUrl } from '../src/app/(app)/features/search/utils/buildSearchUrl';
import {
  DEFAULT_HOTLINES,
  EmergencyLine,
} from '../src/app/(app)/features/search/components/emergency-line';
import { DialButton } from '../src/app/(app)/features/search/components/dial-button';
import {
  EmergencyBox,
  HotlineNumbers,
} from '../src/app/(app)/features/search/components/emergency-box';
import { suggestionPickChanges } from '../src/app/(app)/features/search/v2/landing';
import { nextV2Params } from '../src/app/(app)/features/search/v2/v2-contract';

// A v2 tenant (`enableV2Api` on). Dialing is on for every v2 tenant (Lucas 2026-11-23).
const asV2Tenant = (el: ReturnType<typeof createElement>) =>
  createElement(
    appConfigContext.Provider,
    { value: { featureFlags: { enableV2Api: true } } as never },
    el,
  );

const read = (path: string) => readFileSync(path, 'utf8');
const APP = 'src/app/(app)/';

const HOTLINES = [
  { label: 'Suicide and Crisis Lifeline', number: '988' },
  { label: 'Emergency', number: '911' },
];

// Item 8: safety. On a v2 tenant every emergency control dials (no-dial switch removed 2026-11-23).
test('dialing: every emergency control on a v2 tenant renders a tel: link', () => {
  const html = [
    renderToStaticMarkup(
      asV2Tenant(createElement(EmergencyLine, { hotlines: HOTLINES })),
    ),
    renderToStaticMarkup(
      asV2Tenant(createElement(HotlineNumbers, { hotlines: HOTLINES })),
    ),
    renderToStaticMarkup(
      asV2Tenant(
        createElement(HotlineNumbers, { hotlines: HOTLINES, soft: true }),
      ),
    ),
    renderToStaticMarkup(
      asV2Tenant(createElement(EmergencyBox, { hotlines: HOTLINES })),
    ),
    renderToStaticMarkup(
      asV2Tenant(
        createElement(DialButton, { number: '211', children: 'Call 211' }),
      ),
    ),
  ].join('\n');
  assert.match(html, /href="tel:911"/);
  assert.match(html, /href="tel:988"/);
  assert.match(html, /href="tel:211"/);
  assert.doesNotMatch(html, /data-no-dial|Test mode/);
  assert.match(html, /988/);
  assert.match(html, /911/);
});

// Item 3: suggestions are the v1 bar's own options in the v1 list; a pick opens the results.
test('suggestions: the need box reuses the v1 options and list, with no list of its own', () => {
  const box = read(`${APP}shared/components/search/need-box.tsx`);
  const bar = read(`${APP}shared/components/search/search-bar.tsx`);
  assert.match(box, /useSearchBarOptions/);
  assert.match(box, /AutocompleteListbox/);
  assert.match(box, /groupAutocompleteOptions/);
  assert.doesNotMatch(box, /<ul|<li|useSearchSuggestions/);
  assert.match(bar, /export function useSearchBarOptions/);
  assert.match(bar, /enableOrganizationSearch/);
  assert.match(bar, /const \{ options, isLoading \} = useSearchBarOptions/);
});

test('suggestion pick: any row opens the results with no questions; an organization row scopes it', () => {
  assert.deepEqual(suggestionPickChanges({ value: 'Food Banks' }), {
    query: 'Food Banks',
    query_label: null,
    asked: null,
    refine: null,
    needs: null,
    passed_needs: null,
    urgency: null,
    organization_id: null,
  });
  assert.equal(
    suggestionPickChanges({ value: 'Mercy House', organizationId: 'org-1' })
      .organization_id,
    'org-1',
  );
  const nextParams = nextV2Params(
    new URLSearchParams('query=food&refine=1&asked=q1&organization_id=old'),
    suggestionPickChanges({ value: 'Rent Help' }),
  );
  assert.equal(nextParams.get('query'), 'Rent Help');
  assert.equal(nextParams.get('refine'), null);
  assert.equal(nextParams.get('asked'), null);
  assert.equal(nextParams.get('organization_id'), null);
});

// Item 4: the progress label is gone, with every reference to it.
test('progress label: removed from the guide and the landing helpers', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.doesNotMatch(guide, /guide-progress|progressLabel/);
  assert.doesNotMatch(
    read(`${APP}features/search/v2/landing.ts`),
    /progressLabel/,
  );
});

test('skip: Skip question sits in the same row as Show results now', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const row = guide.slice(guide.indexOf('canSkipQuestion && ('));
  assert.ok(
    row.indexOf('guide-skip-question') < row.indexOf('guide-see-results'),
  );
  assert.equal(guide.match(/data-testid="guide-skip-question"/g)?.length, 1);
});

// Item 2: the whole compact bar is one button.
test('compact bar: one button with an accessible name, whole bar clickable', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  const bar = landing.slice(
    landing.indexOf('{compact && ('),
    landing.indexOf('<form'),
  );
  assert.match(
    bar,
    /<button[\s\S]*aria-label=\{`Edit your search: \$\{query\}`\}/,
  );
  assert.match(
    bar,
    /onClick=\{\(\) => setEditing\(true\)\}[\s\S]*data-testid="landing-compact"/,
  );
  assert.match(bar, /w-full/);
});

// Item 7: a new search from the results page.
test('new search from the results page: no predicted taxonomy, no old answers', () => {
  const url = buildSearchUrl({
    query: 'need food for my kids tonight',
    searchEngine: 'v2' as never,
    skipLegacyLinkCheck: true,
  });
  assert.doesNotMatch(url, /taxonomy=/);
  for (const key of [
    'asked',
    'needs',
    'passed_needs',
    'urgency',
    'other',
    'refine',
  ]) {
    assert.doesNotMatch(url, new RegExp(`[?&]${key}=`));
  }
  // The inline box must not send predicted codes: they make the v2 call skip the area question.
  const box = read(`${APP}shared/components/search/search-inline-box.tsx`);
  assert.doesNotMatch(box, /predictSearchNeeds|taxonomies:/);
});

test('a changed query text drops the old answers from the v2 call', () => {
  const current = new URLSearchParams(
    'query=rent&needs=N-HOU-02&passed_needs=N-HOU-01&urgency=U-3&asked=emergency',
  );
  const next = nextV2Params(current, {
    query: 'need food for my kids tonight',
  });
  for (const key of ['needs', 'passed_needs', 'urgency']) {
    assert.equal(next.get(key), null, key);
  }
});

// Lucas 2026-11-16: after Enter the card does not change until the answer is known
// (no question-shaped skeleton, no buttons), then it shows a question or the results.
test('landing wait: one status line, no skeleton and no buttons before the first answer', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(guide, /const waiting = \(!data && !error\) \|\| finished;/);
  assert.doesNotMatch(guide, /\{!data && !error && <GuideSkeleton \/>\}/);
  assert.match(guide, /showBottomBar\(\{\s*waiting,\s*showBar,/);
  assert.match(
    guide,
    /\{data && \(showLocation \|\| \(card && !isEmergency\)\) && \(/,
  );
});

// UX pass 2026-11-16: on a 390x700 phone the actions sat 211 px below the fold of the dialog.
test('guide actions: the row sticks to the bottom of the dialog and stays one row on a phone', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const row = guide.slice(guide.indexOf('showBottomBar({'));
  assert.match(row.slice(0, 1200), /sticky -bottom-5/);
  assert.match(row.slice(0, 1200), /max-sm:flex-nowrap/);
  assert.match(row, /Skip question/);
  assert.match(row, /'Show results now'/);
  assert.doesNotMatch(row, /Skip this question|Show results now \(/);
});

// UX pass 2026-11-16: Escape or Close on the landing left focus on <body> after going home.
test('landing close: focus goes to the home search box, after the path is home', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  assert.match(
    landing,
    /focusWhenReady\('\/', '\[data-testid="search-trigger"\]'\)/,
  );
  assert.match(landing, /new URL\(document\.URL\)\.pathname === path/);
});

// Lucas 2026-11-06: on a phone a quiet question starts small; orange and red open.
test('refine card: quiet questions start collapsed on a phone only', () => {
  const src = read(`${APP}features/search/components/search-follow-up.tsx`);
  assert.match(
    src,
    /const quiet = !v2 \|\| QUESTION_STYLES\[styleOf\(v2\)\] === QUIET;/,
  );
  assert.match(
    src,
    /if \(quiet && window\.matchMedia\(PHONE_QUERY\)\.matches\) \{\s*setCollapsed\(true\);/,
  );
});

// Lucas 2026-11-18: the red emergency question is a full-screen popup only, with three answers.
test('emergency popup: popup only, three urgency answers, Quick exit inside the dialog', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const card = read(`${APP}features/search/components/search-follow-up.tsx`);
  assert.doesNotMatch(
    guide + card,
    /isSafeAnswer|emergencySafeThisVisitAtom|safeAnsweredInUrl/,
  );
  assert.match(card, /export const SHOW_QUICK_EXIT_ON_EMERGENCY = true;/);
  assert.match(card, /fixed inset-0 z-\[70\][^"]*bg-red-800/);
  assert.match(card, /<Dialog open modal>/);
  assert.doesNotMatch(card, /DialogPrimitive/);
  assert.match(card, /<PopupQuickExit \/>/);
  assert.match(guide, /<EmergencyPopup/);
  // No card under the red popup: the box keeps a question only for the soft band.
  assert.match(guide, /question=\{soft \? card : undefined\}/);
  assert.match(card, /question=\{soft \? question : undefined\}/);
});

// Lucas UX walk 2026-11-19: a small arrow left of the title goes to the previous non-emergency question.
test('guide back: small arrow beside the title, never back to the emergency question', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(guide, /aria-label="Previous question"/);
  assert.doesNotMatch(guide, />\s*Back\s*<\/button>/);
  assert.match(guide, /id !== emergencyId && i >= askedAtStart\.current/);
  assert.match(
    guide,
    /window\.history\.go\(-\(asked\.length - lastBackIdx\)\)/,
  );
  const arrow = guide.indexOf('data-testid="guide-back"');
  assert.ok(arrow > guide.indexOf('card && !isEmergency && style && question'));
  assert.ok(arrow < guide.indexOf('id="guide-question"'));
});

// Lucas UX walk 2026-11-19: after a safe answer the red 911/988 box must not flash in the guide card.
test('safe answer: no hotline box while the old emergency question is still in the data', async () => {
  const { isUrgencyAnswered } =
    await import('../src/app/(app)/features/search/v2/v2-contract');
  assert.equal(isUrgencyAnswered('U-1'), true);
  assert.equal(isUrgencyAnswered('U-2'), true);
  assert.equal(isUrgencyAnswered('U-0'), false);
  assert.equal(isUrgencyAnswered('U-X'), false);
  assert.equal(isUrgencyAnswered(null), false);
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(guide, /!isUrgencyAnswered\(params\.get\('urgency'\)\)/);
});

// Lucas 2026-11-19: one Continue, in the bottom bar, in place of Skip question and Show results now.
test('bottom bar: Continue replaces Skip and Show results now while options are picked; no Continue below the list', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.equal(guide.match(/data-testid="guide-continue"/g)?.length, 1);
  const bar = guide.slice(guide.indexOf('showBottomBar({'));
  assert.ok(bar.includes('data-testid="guide-continue"'));
  assert.match(bar, /\{canSkipQuestion && \(/);
  assert.match(bar, /picks\.length === 0 && \(/);
  assert.ok(
    guide.indexOf('data-testid="guide-continue"') >
      guide.indexOf('showBottomBar({'),
  );
});

test('crisis line: the first search shows the two small buttons, no large 988 button', () => {
  const form = read(`${APP}shared/components/search/search-need-form.tsx`);
  assert.match(form, /<EmergencyLine \/>/);
  assert.doesNotMatch(form, /SearchCrisisButton|in a crisis/);
  const html = renderToStaticMarkup(
    asV2Tenant(createElement(EmergencyLine, { hotlines: HOTLINES })),
  );
  assert.match(html, /always-on-911-link/);
  assert.match(html, /always-on-988-link/);
});

// Landing and need form pass nothing: the line reads the tenant's hotlines and adds 911 and 988.
test('landing and need form draw the line with no props', () => {
  for (const f of [
    'features/search/components/search-landing.tsx',
    'shared/components/search/search-need-form.tsx',
  ]) {
    const src = read(`${APP}${f}`);
    assert.match(src, /<EmergencyLine \/>/);
    assert.doesNotMatch(src, /DEFAULT_HOTLINES/);
  }
  const html = renderToStaticMarkup(
    asV2Tenant(createElement(EmergencyLine, {})),
  );
  assert.match(html, /always-on-911-link/);
  assert.match(html, /always-on-988-link/);
});

// HotlineNumbers and the box show only the API's numbers; the always-on line adds 911 and 988.
test('hotlines only from the response: none sent draws nothing (HotlineNumbers, EmergencyBox)', () => {
  for (const el of [
    createElement(HotlineNumbers, {}),
    createElement(HotlineNumbers, { hotlines: [] }),
  ]) {
    const html = renderToStaticMarkup(asV2Tenant(el));
    assert.equal(html, '');
  }
  const box = renderToStaticMarkup(asV2Tenant(createElement(EmergencyBox, {})));
  assert.doesNotMatch(box, /tel:|911|988/);
  const one = renderToStaticMarkup(
    asV2Tenant(
      createElement(HotlineNumbers, {
        hotlines: [{ label: 'Care line', number: '555' }],
      }),
    ),
  );
  assert.match(one, /tel:555/);
  assert.doesNotMatch(one, /911|988/);
});

// UX round 2026-11-20: the header block never scrolls, so it needs no sticky. The card (innerScroll) keeps
// it and the bottom bar in place and only the guide's scroll region moves.
test('phone: the landing header block (chips and search box) stays put without a sticky hack', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  const header =
    landing.match(/className="([^"]*)"\s*data-testid="landing-header"/)?.[1] ??
    '';
  assert.match(header, /shrink-0/);
  assert.doesNotMatch(landing, /max-sm:sticky/);
});

// The phone card keeps its top padding (room for Back and Quick exit); the header block sits under it
// with no negative margin or offset to cancel it.
test('phone: the card keeps its top padding and the landing header does not fight it', () => {
  const landing = read(`${APP}features/search/components/search-landing.tsx`);
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(guide, /max-sm:rounded-none max-sm:pt-\[4\.25rem\]/);
  const header =
    landing.match(/className="([^"]*)"\s*data-testid="landing-header"/)?.[1] ??
    '';
  assert.doesNotMatch(header, /max-sm:-top-|max-sm:-mt-|max-sm:pt-/);
});

// Lucas 2026-11-19: phone search layer has a top bar (Back top left, Quick exit top right, 44 px each,
// divider under both) and the full-screen change stays phone-only so the 1280 px header still shows.
test('phone layer top bar: Back closes top left, Quick exit top right, divider, 44 px hit areas', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const exit = read(`${APP}shared/components/quick-exit-button.tsx`);
  const close = guide.slice(guide.indexOf('<DialogClose'));
  assert.match(close.slice(0, 700), /max-sm:left-2/);
  assert.match(close.slice(0, 700), /max-sm:h-11/);
  assert.match(close.slice(0, 900), /Back/);
  assert.match(
    guide,
    /data-testid="guide-top-bar"[^>]*|border-b bg-white sm:hidden/,
  );
  assert.match(guide, /max-sm:pt-\[4\.25rem\]/);
  assert.match(exit, /max-sm:top-2 max-sm:right-2/);
  assert.doesNotMatch(exit, /max-sm:left-2/);
  assert.match(exit, /min-h-11/);
});

test('desktop guard: every full-screen / no-header rule in the layer is max-sm only', () => {
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  const cls =
    guide.match(/'fixed top-\[calc\(var\(--guide-top\)[^']*'/)?.[0] ?? '';
  assert.ok(cls, 'dialog class found');
  for (const token of [
    'top-0',
    'left-0',
    'h-dvh',
    'w-full',
    'rounded-none',
    'translate-x-0',
    'pt-[4.25rem]',
  ]) {
    assert.ok(
      cls
        .split(/\s+/)
        .filter((t) => t.includes(token))
        .every((t) => t.startsWith('max-sm:')),
      `${token} must be max-sm only`,
    );
  }
  assert.match(guide, /bg-black\/40 max-sm:hidden/); // dim layer starts under the header on desktop
  assert.match(guide, /document\.querySelector\('header'\)/);
  const bar = guide.slice(
    guide.indexOf('data-testid="guide-top-bar"'),
    guide.indexOf('data-testid="guide-top-bar"') + 200,
  );
  assert.match(bar, /sm:hidden/);
});

// S2 (safety): the soft emergency question renders in the box with its three answers.
test('soft emergency question renders the question and three answers', async () => {
  const { refineQuestionOf } =
    await import('../src/app/(app)/features/search/v2/v2-contract');
  const q = refineQuestionOf(
    {
      clarification: {
        rules_version: 'r',
        questions: [
          {
            id: 'emergency',
            type: 'emergency',
            placement: 'before_results',
            stem: 'Are you in danger right now?',
            options: [],
            multi_select: false,
            allow_other: false,
            none_of_these: false,
            hotlines: HOTLINES,
          },
        ],
      },
    } as never,
    [],
    null,
  )!;
  const html = renderToStaticMarkup(
    asV2Tenant(
      createElement(EmergencyBox, {
        soft: true,
        hotlines: HOTLINES,
        question: {
          id: q.id,
          text: q.stem,
          answers: q.options.map((o) => ({ label: o.label, add: [o.value] })),
        } as never,
        onSkip: () => undefined,
      }),
    ),
  );
  assert.match(html, /Are you in danger right now\?/);
  assert.match(html, /Yes, I am in danger/);
  assert.match(html, /No, I am safe, I need help today/);
  assert.match(html, /No, I am safe, I need help this week/);
  assert.match(html, /data-testid="emergency-skip"/);
  // No i18n provider here: the English default value of t() shows.
  assert.match(html, /Skip to results/);
});

// F4: the words are the page's own now, not the API's `clarification.strings`.
test('skip text: v2_skip_to_results is in the en and es common.json', () => {
  for (const [lang, text] of [
    ['en', 'Skip to results'],
    ['es', 'Ir a los resultados'],
  ]) {
    const json = JSON.parse(read(`public/locales/${lang}/common.json`));
    assert.equal(json.v2_skip_to_results, text, lang);
  }
});

test('popup title is the question stem, the skip text a t() key, with no strings left', () => {
  const popup = read(`${APP}features/search/components/search-follow-up.tsx`);
  const box = read(`${APP}features/search/components/emergency-box.tsx`);
  const guide = read(`${APP}shared/components/search/search-guide.tsx`);
  assert.match(popup, /question\.stem\.trim\(\) \|\| POPUP_TITLE_FALLBACK/);
  assert.doesNotMatch(popup, /popupTitle|skipLabel|stringsOf|alsoFitOne/);
  assert.match(box, /t\('v2_skip_to_results', 'Skip to results'\)/);
  assert.match(guide, /t\('v2_skip_to_results', 'Skip to results'\)/);
  assert.doesNotMatch(box + guide, /skipLabel|stringsOf|strings\./);
});
