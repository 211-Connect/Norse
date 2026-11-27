import type { Payload } from 'payload';
import { cache } from 'react';

import { localizedLandingHref } from '@/app/(app)/features/landing-pages/lib/slugs';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import type { LandingPage, LandingPageTopic } from '@/payload/payload-types';
import { tenantCanonicalHost } from '@/utils/canonicalHost';

/**
 * Admin helpers for the landing page list and editor (docs/landing-pages.md,
 * "Admin"): every page's addresses with links, and the CSV export.
 */

export type PageAddress = {
  locale: string;
  path: string;
  current: boolean;
  /** Absolute URL on the canonical host, or a site path without one. */
  href: string;
};

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value
    ? (value as { id: number | string }).id
    : (value as number | string);

// Once per server render: the list's URL cell asks for every row.
const tenantHosting = cache(async (payload: Payload, tenantId: string) => {
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
    depth: 0,
  });
  const host = tenantCanonicalHost(tenant);
  return {
    defaultLocale: tenant.defaultLocale ?? 'en',
    origin: host ? `https://${host}` : '',
  };
});

/** Page id → its addresses, current ones first, in tenant locale order. */
export async function listPageAddresses(
  payload: Payload,
  tenantId: string,
  pageIds: readonly (number | string)[],
): Promise<Map<string, PageAddress[]>> {
  const result = new Map<string, PageAddress[]>();
  if (pageIds.length === 0) return result;
  const [{ docs }, hosting] = await Promise.all([
    payload.find({
      collection: 'landing-page-slugs',
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { page: { in: pageIds.map(Number) } },
        ],
      },
      sort: '-current',
      depth: 0,
      pagination: false,
    }),
    tenantHosting(payload, tenantId),
  ]);
  for (const row of docs) {
    const pageId = String(idOf(row.page));
    const list = result.get(pageId) ?? [];
    list.push({
      locale: row.locale,
      path: row.path,
      current: Boolean(row.current),
      href:
        hosting.origin +
        localizedLandingHref(row.path, row.locale, hosting.defaultLocale),
    });
    result.set(pageId, list);
  }
  for (const list of result.values()) {
    list.sort(
      (a, b) =>
        Number(b.current) - Number(a.current) ||
        Number(b.locale === hosting.defaultLocale) -
          Number(a.locale === hosting.defaultLocale) ||
        a.locale.localeCompare(b.locale),
    );
  }
  return result;
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Every page of the tenant as CSV, one row per page. */
export async function exportLandingPagesCsv(tenantId: string): Promise<string> {
  const payload = await getPayloadSingleton();
  const [{ docs: pages }, { docs: topics }] = await Promise.all([
    payload.find({
      collection: 'landing-pages',
      where: { tenant: { equals: tenantId } },
      sort: 'label',
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'landing-page-topics',
      where: { tenant: { equals: tenantId } },
      depth: 0,
      pagination: false,
      trash: true,
    }),
  ]);
  const topicName = new Map(
    topics.map((topic: LandingPageTopic) => [String(topic.id), topic.name]),
  );
  const addresses = await listPageAddresses(
    payload,
    tenantId,
    pages.map((page) => page.id),
  );
  const locales = [
    ...new Set(
      [...addresses.values()].flatMap((list) => list.map((a) => a.locale)),
    ),
  ].sort();

  const header = [
    'id',
    'topic',
    'place',
    'level',
    'state',
    'status',
    'result_count',
    'counted_at',
    ...locales.map((locale) => `url_${locale}`),
  ];
  const rows = pages.map((page: LandingPage) => {
    const current = new Map(
      (addresses.get(String(page.id)) ?? [])
        .filter((a) => a.current)
        .map((a) => [a.locale, a.href]),
    );
    return [
      page.id,
      topicName.get(String(idOf(page.topic))) ?? '',
      page.regionName,
      page.regionType,
      page.regionState,
      page.status,
      page.resultCount,
      page.countedAt,
      ...locales.map((locale) => current.get(locale) ?? ''),
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
