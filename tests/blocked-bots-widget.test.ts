import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  ANALYTICS_DEFAULT_LAYOUT,
  WIDGET_INFO,
  WidgetSlug,
} from '../src/payload/components/analytics/widgetInfo';

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
});
