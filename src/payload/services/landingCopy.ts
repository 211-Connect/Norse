import type { Where } from 'payload';

import {
  type CopyLayers,
  type CopyTagValues,
  type CopyTexts,
  regionDisplayName,
} from '@/app/(app)/features/landing-pages/lib/copy';
import {
  STATE_NAMES,
  localizedLandingHref,
} from '@/app/(app)/features/landing-pages/lib/slugs';
import { loadLandingStrings } from '@/app/(app)/features/landing-pages/lib/strings';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { defaultLocale } from '@/payload/i18n/locales';
import type { LandingPage, LandingPageTopic } from '@/payload/payload-types';
import { tenantCanonicalHost } from '@/utils/canonicalHost';

/**
 * What landing-page copy is built from, for one tenant and locale
 * (docs/landing-pages.md, "Page copy"): the layers below the page, the tag
 * values and the address. The page renders with it; the admin previews fill
 * it with the unsaved form values.
 */

export type LandingCopyContext = {
  /** The topic, template and built-in layers. */
  layers: CopyLayers;
  values: CopyTagValues;
  host: string | null;
  /** The sample page's current URL in the locale, as a site path. */
  path: string | null;
};

const idOf = (value: unknown) =>
  value && typeof value === 'object' && 'id' in value
    ? (value as { id: number | string }).id
    : (value as number | string | null | undefined);

const copyOf = (doc: { copy?: unknown } | null | undefined): CopyTexts => {
  const copy = (doc?.copy ?? {}) as CopyTexts;
  return {
    title: copy.title,
    description: copy.description,
    h1: copy.h1,
    intro: copy.intro,
  };
};

type RegionLike = {
  type: 'state' | 'county' | 'place';
  name: string;
  state: string;
};

export async function getLandingCopyContext(input: {
  tenantId: string;
  locale: string;
  topicId?: string | null;
}): Promise<LandingCopyContext> {
  const { tenantId, locale } = input;
  const payload = await getPayloadSingleton();
  const forTenant = (extra: Where): Where => ({
    and: [{ tenant: { equals: tenantId } }, extra],
  });

  const [tenant, { docs: directories }, strings] = await Promise.all([
    payload.findByID({ collection: 'tenants', id: tenantId, depth: 0 }),
    payload.find({
      collection: 'resource-directories',
      where: { tenant: { equals: tenantId } },
      locale: locale as never,
      limit: 1,
      depth: 0,
    }),
    loadLandingStrings(locale),
  ]);
  const directory = directories[0];

  const first = async <T>(
    collection: 'landing-pages' | 'landing-page-topics',
    where: Where,
  ): Promise<T | null> => {
    const { docs } = await payload.find({
      collection,
      where: forTenant(where),
      locale: locale as never,
      limit: 1,
      depth: 0,
      trash: true,
    });
    return (docs[0] as T | undefined) ?? null;
  };

  // A live page to preview with: the given topic's if
  // any, a county first (it reads best in a sample).
  const live: Where[] = [
    { status: { equals: 'live' } },
    ...(input.topicId ? [{ topic: { equals: Number(input.topicId) } }] : []),
  ];
  const page =
    (await first<LandingPage>('landing-pages', {
      and: [...live, { regionType: { equals: 'county' } }],
    })) ?? (await first<LandingPage>('landing-pages', { and: live }));

  const topicId = input.topicId ?? idOf(page?.topic);
  const topic = await first<LandingPageTopic>(
    'landing-page-topics',
    topicId ? { id: { equals: Number(topicId) } } : {},
  );

  const selected = (directory?.landingPages?.regions ?? []) as RegionLike[];
  const region: RegionLike = page
    ? { type: page.regionType, name: page.regionName, state: page.regionState }
    : (selected.find((r) => r.type === 'county') ??
      selected[0] ?? { type: 'county', name: 'Pierce County', state: 'WA' });
  const stateName = STATE_NAMES[region.state] ?? region.state;

  let path: string | null = null;
  if (page) {
    const { docs } = await payload.find({
      collection: 'landing-page-slugs',
      where: forTenant({
        and: [
          { page: { equals: page.id } },
          { locale: { equals: locale } },
          { current: { equals: true } },
        ],
      }),
      limit: 1,
      depth: 0,
    });
    path = docs[0]
      ? localizedLandingHref(
          docs[0].path,
          locale,
          tenant.defaultLocale ?? defaultLocale,
        )
      : null;
  }

  return {
    layers: {
      topic: copyOf(topic),
      template: copyOf({ copy: directory?.landingPages?.templates }),
      default: strings.defaults,
    },
    values: {
      topic: topic?.name ?? 'Food',
      location: regionDisplayName(region, strings.region, stateName),
      state: stateName,
      name: directory?.name ?? undefined,
      phone: directory?.brand?.phoneNumber ?? undefined,
      email: directory?.brand?.email ?? undefined,
    },
    host: tenantCanonicalHost(tenant),
    path,
  };
}
