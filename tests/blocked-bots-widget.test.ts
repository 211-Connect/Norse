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
  test('reads the event the proxy emits, by classification', () => {
    assert.equal(BLOCKED_BOTS_EVENT, BLOCKED_TRAFFIC_EVENT_NAME);
    assert.equal(BLOCKED_BOTS_PROPERTY, 'classification');
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

  test('segments: fixed classification order, counts and rounded shares', () => {
    const { total, segments } = buildBlockedBotsSegments([
      { value: 'seo', total: 10 },
      { value: 'nefarious', total: 30 },
    ]);
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
    assert.deepEqual(buildBlockedBotsSegments([]), { total: 0, segments: [] });
  });
});
