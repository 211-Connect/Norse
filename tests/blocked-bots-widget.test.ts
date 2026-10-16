import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { BLOCKED_TRAFFIC_EVENT_NAME } from '../src/lib/blocked-traffic-events';
import {
  BLOCKED_BOTS_EVENT,
  BLOCKED_BOTS_PROPERTY,
  buildBlockedBotsSegments,
} from '../src/payload/components/analytics/widgets/blockedBotsSegments';
import {
  ANALYTICS_DEFAULT_LAYOUT,
  WIDGET_INFO,
  WidgetSlug,
} from '../src/payload/components/analytics/widgetInfo';

describe('Blocked Bots widget (ISS-2366)', () => {
  test('reads the event the proxy emits, by segment', () => {
    assert.equal(BLOCKED_BOTS_EVENT, BLOCKED_TRAFFIC_EVENT_NAME);
    assert.equal(BLOCKED_BOTS_PROPERTY, 'segment');
  });

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
  });

  test('description explains the detected-but-not-blocked slice', () => {
    assert.match(WIDGET_INFO[WidgetSlug.BlockedBots], /not blocked/i);
  });

  test('segments: fixed classification order, counts and rounded shares', () => {
    const { total, blocked, notEnforced, segments } = buildBlockedBotsSegments([
      { value: 'seo', total: 10 },
      { value: 'nefarious', total: 30 },
    ]);
    assert.equal(total, 40);
    assert.equal(blocked, 40);
    assert.equal(notEnforced, 0);
    assert.deepEqual(
      segments.map((s) => [s.key, s.rawValue, s.value]),
      [
        ['nefarious', 30, 75],
        ['seo', 10, 25],
        ['unknown', 0, 0],
      ],
    );
  });

  test('segments: not_enforced is its own slice and is not counted as blocked', () => {
    const { total, blocked, notEnforced, segments } = buildBlockedBotsSegments([
      { value: 'nefarious', total: 25 },
      { value: 'not_enforced', total: 75 },
    ]);
    assert.equal(total, 100);
    assert.equal(blocked, 25);
    assert.equal(notEnforced, 75);
    const slice = segments.find((s) => s.key === 'not_enforced');
    assert.equal(slice?.rawValue, 75);
    assert.equal(slice?.value, 75);
    assert.match(slice?.label ?? '', /not blocked/i);
    assert.equal(
      segments.find((s) => s.key === 'other'),
      undefined,
    );
  });

  test('segments: no not_enforced slice when there is none', () => {
    const { segments } = buildBlockedBotsSegments([{ value: 'seo', total: 1 }]);
    assert.equal(
      segments.find((s) => s.key === 'not_enforced'),
      undefined,
    );
  });

  test('segments: unexpected values are folded into Other', () => {
    const { segments } = buildBlockedBotsSegments([
      { value: 'Unknown', total: 1 },
      { value: 'weird', total: 3 },
    ]);
    const other = segments.find((s) => s.key === 'other');
    assert.equal(other?.rawValue, 3);
    assert.equal(segments.find((s) => s.key === 'unknown')?.rawValue, 1);
  });

  test('segments: empty data gives total 0 and no segments', () => {
    assert.deepEqual(buildBlockedBotsSegments([]), {
      total: 0,
      blocked: 0,
      notEnforced: 0,
      segments: [],
    });
  });
});
