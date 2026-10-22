import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { buildBlockedBotsSegments } from '../src/payload/components/analytics/widgets/blockedBotsSegments';
import {
  ANALYTICS_DEFAULT_LAYOUT,
  WIDGET_INFO,
  WidgetSlug,
} from '../src/payload/components/analytics/widgetInfo';

const byClassification = (
  nefarious: number,
  seo: number,
  unknown: number,
  notEnforced = 0,
) => [
  { classification: 'seo' as const, blocked: seo, notEnforced: 0 },
  { classification: 'nefarious' as const, blocked: nefarious, notEnforced },
  { classification: 'unknown' as const, blocked: unknown, notEnforced: 0 },
];

describe('Blocked Bots widget (ISS-2366)', () => {
  test('is in the default layout right after Page Views', () => {
    const slugs = ANALYTICS_DEFAULT_LAYOUT.map((w) => w.widgetSlug);
    const pageViews = slugs.indexOf(WidgetSlug.PageViews);
    assert.ok(pageViews >= 0);
    assert.equal(slugs[pageViews + 1], WidgetSlug.BlockedBots);
    assert.equal(WidgetSlug.BlockedBots, 'analytics-blocked-bots');
  });

  test('descriptions: Page Views points at Blocked Bots and both say what is excluded', () => {
    assert.match(WIDGET_INFO[WidgetSlug.PageViews], /Blocked Bots/);
    assert.match(
      WIDGET_INFO[WidgetSlug.BlockedBots],
      /not included in Page Views/,
    );
    assert.match(WIDGET_INFO[WidgetSlug.BlockedBots], /not blocked/i);
  });

  test('segments: fixed classification order, counts and rounded shares', () => {
    const { total, segments } = buildBlockedBotsSegments({
      blocked: 40,
      notEnforced: 0,
      byClassification: byClassification(30, 10, 0),
    });
    assert.equal(total, 40);
    assert.deepEqual(
      segments.map((s) => [s.key, s.rawValue, s.value]),
      [
        ['nefarious', 30, 75],
        ['seo', 10, 25],
        ['unknown', 0, 0],
      ],
    );
  });

  test('segments: observe-only denials are their own slice, not blocked', () => {
    const { total, segments } = buildBlockedBotsSegments({
      blocked: 25,
      notEnforced: 75,
      byClassification: byClassification(25, 0, 0, 75),
    });
    assert.equal(total, 100);
    assert.equal(segments.find((s) => s.key === 'nefarious')?.rawValue, 25);
    const slice = segments.find((s) => s.key === 'not_enforced');
    assert.equal(slice?.rawValue, 75);
    assert.equal(slice?.value, 75);
    assert.match(slice?.label ?? '', /not blocked/i);
  });

  test('segments: no observe-only slice when there is none', () => {
    const { segments } = buildBlockedBotsSegments({
      blocked: 1,
      notEnforced: 0,
      byClassification: byClassification(0, 1, 0),
    });
    assert.equal(
      segments.find((s) => s.key === 'not_enforced'),
      undefined,
    );
  });

  test('segments: nothing detected gives total 0 and no segments', () => {
    assert.deepEqual(
      buildBlockedBotsSegments({
        blocked: 0,
        notEnforced: 0,
        byClassification: [],
      }),
      { total: 0, segments: [] },
    );
  });
});
