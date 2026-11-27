import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { CachedAppConfig } from '../src/app/(app)/shared/utils/buildAppConfig';
import {
  getPublicAppConfigKey,
  toPublicAppConfig,
} from '../src/payload/collections/ResourceDirectories/utilities/toPublicAppConfig';

const TENANT = '8cc9b7db-886b-478b-a0f8-1a774fdd0b63';

const config = {
  brand: {
    name: 'Wyoming 211',
    logoUrl: 'https://cdn.example.org/logo.png',
    theme: { primaryColor: '#005191', secondaryColor: '#FFB351' },
  },
  meta: { title: 'Wyoming 211', description: 'Find help' },
  contact: { number: '211' },
  header: {
    customMenu: [
      { name: 'About', href: '/about', openInNewTab: null },
      { name: '' },
    ],
    customHomeUrl: 'https://wy211.org',
    feedbackUrl: 'https://wy211.org/feedback',
    position: 'sticky',
  },
  footer: {
    customMenu: [],
    copyright: '© Wyoming 211',
    disclaimer: 'Info only',
  },
  pages: {
    accessibilityPage: {
      enabled: true,
      title: 'Accessibility',
      content: '<p>long</p>',
    },
    privacyPolicyPage: { enabled: false },
    termsOfUsePage: { enabled: true, title: 'Terms', content: '<p>long</p>' },
  },
  printableDirectories: {
    accessMode: 'allowlist',
    allowedEmails: ['someone@example.org'],
    allowedDomains: ['example.org'],
    userGroups: [
      {
        name: 'Staff',
        emails: ['staff@example.org'],
        domains: [],
        capabilities: [],
      },
    ],
  },
  sms: { provider: 'Twilio' },
  umamiWebsiteId: 'umami-id',
  gtmContainerId: 'GTM-XYZ',
  heroUrl: 'https://cdn.example.org/hero.png',
  alerts: [
    {
      text: 'Closed Monday',
      url: 'https://wy211.org/closed',
      target: '_blank',
    },
  ],
  i18n: { defaultLocale: 'en', locales: ['en', 'es'] },
  search: {
    map: { center: [-107.290283, 43.07597], zoom: 7 },
    defaultRadius: 25,
    resultsLimit: 25,
    facets: [
      {
        name: 'Days',
        facet: 'days',
        showInDetails: true,
        sortBy: 'dayOfWeek',
        excludeValues: ['Unknown'],
      },
    ],
  },
} as unknown as CachedAppConfig;

describe('toPublicAppConfig', () => {
  const result = toPublicAppConfig(TENANT, 'en', config);
  const serialized = JSON.stringify(result);

  test('keeps the fields the mobile app and provider-feedback read', () => {
    assert.equal(result.tenantId, TENANT);
    assert.equal(result.locale, 'en');
    assert.equal(result.brand.name, 'Wyoming 211');
    assert.equal(result.brand.theme.primaryColor, '#005191');
    assert.deepEqual(result.search, {
      map: { center: [-107.290283, 43.07597], zoom: 7 },
      defaultRadius: 25,
      facets: [
        {
          facet: 'days',
          sortBy: 'dayOfWeek',
          valueOrder: undefined,
          excludeValues: ['Unknown'],
        },
      ],
    });
    assert.deepEqual(result.alerts, [
      {
        text: 'Closed Monday',
        buttonText: undefined,
        url: 'https://wy211.org/closed',
        target: '_blank',
        variant: undefined,
      },
    ]);
    assert.equal(result.footer.copyright, '© Wyoming 211');
    assert.equal(result.header.feedbackUrl, 'https://wy211.org/feedback');
    assert.deepEqual(result.header.customMenu, [
      { name: 'About', href: '/about', openInNewTab: undefined },
    ]);
  });

  test('leaves out allowlisted emails and other internal fields', () => {
    assert.ok(!('printableDirectories' in result));
    assert.ok(!serialized.includes('example.org"]'));
    assert.ok(!serialized.includes('someone@example.org'));
    assert.ok(!serialized.includes('staff@example.org'));
    assert.ok(!serialized.includes('umami-id'));
    assert.ok(!serialized.includes('GTM-XYZ'));
    assert.ok(!serialized.includes('Twilio'));
  });

  test('passes legal page titles and switches, not their content', () => {
    assert.deepEqual(result.pages.accessibilityPage, {
      enabled: true,
      title: 'Accessibility',
    });
    assert.deepEqual(result.pages.privacyPolicyPage, {
      enabled: false,
      title: undefined,
    });
    assert.ok(!serialized.includes('<p>long</p>'));
  });
});

describe('getPublicAppConfigKey', () => {
  test('is per tenant and locale', () => {
    assert.equal(
      getPublicAppConfigKey(TENANT, 'es'),
      `public_app_config:${TENANT}:es`,
    );
  });
});

describe('buildAppConfigFromResourceDirectory', () => {
  test('falls back to the center of the USA as [longitude, latitude]', async () => {
    const { buildAppConfigFromResourceDirectory } =
      await import('../src/app/(app)/shared/utils/buildAppConfig');
    const fallback = buildAppConfigFromResourceDirectory(null, null, 'en');
    assert.deepEqual(fallback.search.map.center, [-98.5794797, 39.8283459]);
  });
});
