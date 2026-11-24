import type { Payload, Where } from 'payload';

import {
  type LandingStore,
  type PageRow,
  resolveLandingPath,
} from '@/app/(app)/features/landing-pages/lib/resolve';
import type {
  LandingCopy,
  LandingLink,
  LandingPageView,
  LandingRegion,
  LandingResolution,
  LandingSitemap,
} from '@/app/(app)/features/landing-pages/lib/types';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { defaultLocale } from '@/payload/i18n/locales';
import type {
  LandingPage,
  LandingPageSlug,
  LandingPageTopic,
} from '@/payload/payload-types';

/**
 * The CMS side of landing pages (docs/landing-pages.md): reads the
 * `landing-page-*` collections for one tenant. The public app reaches it
 * through `@/lib/cms/landing-pages`. Every query is scoped to the tenant.
 */

type Localized<T> = Partial<Record<string, T>> | T | null | undefined;

/** A field read with `locale: 'all'` comes back as `{ en: …, es: … }`. */
function pick<T>(value: Localized<T>, locale: string): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (value as Partial<Record<string, T>>)[locale] ?? undefined;
  }
  return value as T;
}

function pickCopy(
  copy: Record<string, Localized<string>> | null | undefined,
  locale: string,
): LandingCopy {
  return {
    title: pick(copy?.title, locale) || null,
    description: pick(copy?.description, locale) || null,
    h1: pick(copy?.h1, locale) || null,
    intro: pick(copy?.intro, locale) || null,
  };
}

function regionOf(page: LandingPage): LandingRegion {
  return {
    id: page.regionId,
    type: page.regionType,
    name: page.regionName,
    state: page.regionState,
    countyId: page.countyId ?? null,
  };
}

const idOf = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' && value !== null ? value.id : value;

class PayloadLandingStore implements LandingStore {
  constructor(
    private readonly payload: Payload,
    private readonly tenantId: string,
  ) {}

  private where(extra: Where): Where {
    return { and: [{ tenant: { equals: this.tenantId } }, extra] };
  }

  async findSlug(locale: string, path: string) {
    const { docs } = await this.payload.find({
      collection: 'landing-page-slugs',
      where: this.where({
        locale: { equals: locale },
        path: { equals: path },
      }),
      limit: 1,
      depth: 0,
      pagination: false,
    });
    const row = docs[0];
    if (!row) return null;
    return {
      pageId: String(idOf(row.page)),
      locale: row.locale,
      path: row.path,
      current: Boolean(row.current),
    };
  }

  private async page(id: string): Promise<LandingPage | null> {
    const { docs } = await this.payload.find({
      collection: 'landing-pages',
      where: this.where({ id: { equals: Number(id) } }),
      limit: 1,
      depth: 0,
      locale: 'all',
      pagination: false,
    });
    return docs[0] ?? null;
  }

  async findPage(id: string): Promise<PageRow | null> {
    const page = await this.page(id);
    if (!page) return null;
    const redirectPage = idOf(page.redirect?.page);
    return {
      id: String(page.id),
      status: page.status,
      redirectPageId: redirectPage ? String(redirectPage) : null,
      redirectPath: page.redirect?.path ?? null,
    };
  }

  async currentPath(pageId: string, locale: string) {
    const paths = await this.currentPaths([pageId], locale);
    return paths.get(pageId) ?? null;
  }

  /** Page id → current path in one locale. */
  private async currentPaths(
    pageIds: readonly string[],
    locale: string,
  ): Promise<Map<string, string>> {
    if (pageIds.length === 0) return new Map();
    const { docs } = await this.payload.find({
      collection: 'landing-page-slugs',
      where: this.where({
        page: { in: pageIds.map(Number) },
        locale: { equals: locale },
        current: { equals: true },
      }),
      depth: 0,
      pagination: false,
    });
    return new Map(docs.map((row) => [String(idOf(row.page)), row.path]));
  }

  /** Live pages of a topic matching `extra`, as links in a locale. */
  private async links(
    topicId: number,
    extra: Where,
    locale: string,
  ): Promise<LandingLink[]> {
    const { docs } = await this.payload.find({
      collection: 'landing-pages',
      where: this.where({
        and: [
          { topic: { equals: topicId } },
          { status: { equals: 'live' } },
          extra,
        ],
      }),
      depth: 0,
      pagination: false,
      sort: 'regionName',
    });
    const paths = await this.currentPaths(
      docs.map((doc) => String(doc.id)),
      locale,
    );
    return docs.flatMap((doc) => {
      const path = paths.get(String(doc.id));
      return path ? [{ path, region: regionOf(doc) }] : [];
    });
  }

  async view(pageId: string, locale: string): Promise<LandingPageView | null> {
    const page = await this.page(pageId);
    if (!page || page.status !== 'live') return null;
    const topicId = idOf(page.topic);
    if (!topicId) return null;

    const topic = await this.payload.findByID({
      collection: 'landing-page-topics',
      id: topicId,
      depth: 0,
      locale: 'all',
      // A trashed topic's pages stay live until Apply changes retires them.
      trash: true,
    });

    const { docs: slugRows } = await this.payload.find({
      collection: 'landing-page-slugs',
      where: this.where({
        page: { equals: page.id },
        current: { equals: true },
      }),
      depth: 0,
      pagination: false,
    });
    const alternates = Object.fromEntries(
      slugRows.map((row: LandingPageSlug) => [row.locale, row.path]),
    );
    const path = alternates[locale];
    if (!path) return null;

    const region = regionOf(page);
    const parents: LandingLink[] = [];
    if (region.type !== 'state') {
      parents.push(
        ...(await this.links(
          topicId,
          {
            regionType: { equals: 'state' },
            regionState: { equals: region.state },
          },
          locale,
        )),
      );
    }
    if (region.type === 'place' && region.countyId) {
      parents.push(
        ...(await this.links(
          topicId,
          { regionId: { equals: region.countyId } },
          locale,
        )),
      );
    }
    const children =
      region.type === 'state'
        ? await this.links(
            topicId,
            {
              regionType: { equals: 'county' },
              regionState: { equals: region.state },
            },
            locale,
          )
        : region.type === 'county'
          ? await this.links(
              topicId,
              {
                regionType: { equals: 'place' },
                countyId: { equals: region.id },
              },
              locale,
            )
          : [];

    const name =
      pick(topic.name as Localized<string>, locale) ??
      pick(topic.name as Localized<string>, defaultLocale) ??
      '';
    return {
      id: String(page.id),
      topic: {
        id: String(topic.id),
        name,
        search: {
          queryType: topic.search.queryType,
          query: topic.search.query,
        },
        copy: pickCopy(topic.copy as Record<string, Localized<string>>, locale),
      },
      region,
      path,
      alternates,
      parents,
      children,
    };
  }
}

/** What a landing-page path answers for a tenant and locale. */
export async function resolveLandingPage(
  tenantId: string,
  locale: string,
  path: string,
): Promise<LandingResolution> {
  const payload = await getPayloadSingleton();
  return resolveLandingPath(
    new PayloadLandingStore(payload, tenantId),
    locale,
    path,
  );
}

/** Every live page with its current path per locale, for the sitemaps. */
export async function listLandingSitemap(
  tenantId: string,
): Promise<LandingSitemap> {
  const payload = await getPayloadSingleton();
  const tenant: Where = { tenant: { equals: tenantId } };

  const [{ docs: pages }, { docs: slugs }, { docs: topics }] =
    await Promise.all([
      payload.find({
        collection: 'landing-pages',
        where: { and: [tenant, { status: { equals: 'live' } }] },
        depth: 0,
        pagination: false,
        sort: 'regionName',
      }),
      payload.find({
        collection: 'landing-page-slugs',
        where: { and: [tenant, { current: { equals: true } }] },
        depth: 0,
        pagination: false,
      }),
      payload.find({
        collection: 'landing-page-topics',
        where: tenant,
        depth: 0,
        locale: 'all',
        pagination: false,
        trash: true,
      }),
    ]);

  const pathsByPage = new Map<string, Record<string, string>>();
  const slugUpdated = new Map<string, string>();
  for (const row of slugs) {
    const pageId = String(idOf(row.page));
    const paths = pathsByPage.get(pageId) ?? {};
    paths[row.locale] = row.path;
    pathsByPage.set(pageId, paths);
    const previous = slugUpdated.get(pageId);
    if (!previous || row.updatedAt > previous) {
      slugUpdated.set(pageId, row.updatedAt);
    }
  }

  return {
    topics: Object.fromEntries(
      topics.map((topic: LandingPageTopic) => [
        String(topic.id),
        (typeof topic.name === 'object' && topic.name !== null
          ? topic.name
          : { [defaultLocale]: topic.name }) as Record<string, string>,
      ]),
    ),
    entries: pages.flatMap((page) => {
      const id = String(page.id);
      const paths = pathsByPage.get(id);
      if (!paths) return [];
      const slugDate = slugUpdated.get(id) ?? page.updatedAt;
      return [
        {
          id,
          topicId: String(idOf(page.topic)),
          region: regionOf(page),
          paths,
          lastModified: slugDate > page.updatedAt ? slugDate : page.updatedAt,
        },
      ];
    }),
  };
}

/**
 * Changes whenever a topic, page or address of the tenant changes: the
 * latest `updatedAt` among them. Caches of resolved pages and sitemaps
 * include it in their keys.
 */
export async function getLandingPagesVersion(
  tenantId: string,
): Promise<string> {
  const payload = await getPayloadSingleton();
  const latest = await Promise.all(
    (
      ['landing-page-topics', 'landing-pages', 'landing-page-slugs'] as const
    ).map(async (collection) => {
      const { docs } = await payload.find({
        collection,
        where: { tenant: { equals: tenantId } },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
        pagination: false,
        select: { updatedAt: true },
        // Moving a topic to the trash is a change too.
        trash: true,
      });
      return docs[0]?.updatedAt ?? '';
    }),
  );
  return latest.sort().at(-1) || 'empty';
}
