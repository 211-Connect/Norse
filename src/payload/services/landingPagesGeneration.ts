import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

import {
  type ExistingPage,
  type ExistingSlug,
  type GenerationPlan,
  type PageRef,
  type PlanSummary,
  type PlanTopic,
  type SelectedRegion,
  planGeneration,
  regionLabel,
} from '@/app/(app)/features/landing-pages/lib/plan';
import { buildSearchUrl } from '@/app/(app)/features/search/utils/buildSearchUrl';
import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';

const log = createLogger('landing-pages-generation');

/**
 * Applies the landing-page generation plan (`lib/plan.ts`) for one tenant:
 * reads the Resource Directory's selection, the topics and the existing
 * rows, and writes the diff in one transaction. Generated rows are written
 * with SQL in bulk (a state can mean 100k addresses), so they have no
 * Payload version until someone edits them. docs/landing-pages.md.
 */

export const GENERATE_LANDING_PAGES_TASK = 'generateLandingPages';

type Row = Record<string, unknown>;
type SqlExecutor = {
  execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Row[] }>;
};
type Db = SqlExecutor & {
  transaction: <T>(run: (tx: SqlExecutor) => Promise<T>) => Promise<T>;
};

const db = (payload: Payload) =>
  (payload.db as unknown as { drizzle: Db }).drizzle;

const CHUNK = 500;
const chunks = <T>(items: readonly T[]) =>
  Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) =>
    items.slice(i * CHUNK, (i + 1) * CHUNK),
  );

export class LandingGenerationError extends Error {}

type Localized = Partial<Record<string, string | null>>;
const asLocalized = (value: unknown): Localized =>
  value && typeof value === 'object' ? (value as Localized) : {};

async function loadInput(payload: Payload, tenantId: string) {
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantId,
    depth: 0,
  });
  const { docs: directories } = await payload.find({
    collection: 'resource-directories',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 0,
    pagination: false,
  });
  const directory = directories[0];
  if (!directory?.featureFlags?.enableLandingPages) {
    throw new LandingGenerationError(
      'Landing pages are not enabled for this Resource Directory.',
    );
  }

  const { docs: topicDocs } = await payload.find({
    collection: 'landing-page-topics',
    where: { tenant: { equals: tenantId } },
    locale: 'all',
    depth: 0,
    pagination: false,
  });
  const topics: PlanTopic[] = topicDocs.map((topic) => ({
    id: topic.id,
    enabled: topic.enabled !== false,
    slugs: asLocalized(topic.slug),
    names: asLocalized(topic.name),
    search: { queryType: topic.search.queryType, query: topic.search.query },
  }));

  const { rows: pageRows } = await db(payload).execute(sql`
    SELECT
      id,
      topic_id,
      region_id,
      region_type,
      region_name,
      region_state,
      county_id,
      place_slug,
      status,
      redirect_page_id,
      redirect_path
    FROM
      lp_pages
    WHERE
      tenant_id = ${tenantId}
  `);
  const pages: ExistingPage[] = pageRows.map((row) => ({
    id: Number(row.id),
    topicId: Number(row.topic_id),
    regionId: String(row.region_id),
    regionType: row.region_type as ExistingPage['regionType'],
    regionName: String(row.region_name),
    regionState: String(row.region_state),
    countyId: (row.county_id as string | null) ?? null,
    placeSlug: String(row.place_slug),
    status: row.status as ExistingPage['status'],
    redirectPageId: row.redirect_page_id ? Number(row.redirect_page_id) : null,
    redirectPath: (row.redirect_path as string | null) ?? null,
  }));

  const { rows: slugRows } = await db(payload).execute(sql`
    SELECT
      id,
      page_id,
      locale,
      path,
      current
    FROM
      lp_slugs
    WHERE
      tenant_id = ${tenantId}
  `);
  const slugs: ExistingSlug[] = slugRows.map((row) => ({
    id: Number(row.id),
    pageId: Number(row.page_id),
    locale: String(row.locale),
    path: String(row.path),
    current: Boolean(row.current),
  }));

  const enabledLocales = (tenant.enabledLocales ?? []) as string[];
  const defaultLocale = tenant.defaultLocale ?? 'en';
  return {
    locales: enabledLocales.includes(defaultLocale)
      ? enabledLocales
      : [defaultLocale, ...enabledLocales],
    defaultLocale,
    regions: (directory.landingPages?.regions ?? []) as SelectedRegion[],
    topics,
    pages,
    slugs,
    searchPath: (topic: PlanTopic, region: SelectedRegion) =>
      buildSearchUrl({
        query: topic.search.query,
        queryType: topic.search.queryType,
        region: region.id,
        location: regionLabel(region),
        searchEngine: 'classic',
      }),
  };
}

/** The diff Apply changes would write, without writing it. */
export async function previewLandingPages(
  tenantId: string,
): Promise<GenerationPlan> {
  const payload = await getPayloadSingleton();
  return planGeneration(await loadInput(payload, tenantId));
}

async function writePlan(
  tx: SqlExecutor,
  tenantId: string,
  plan: GenerationPlan,
): Promise<void> {
  const created = new Map<string, number>();
  for (const batch of chunks(plan.creates)) {
    const { rows } = await tx.execute(sql`
      INSERT INTO
        lp_pages (
          tenant_id,
          label,
          topic_id,
          status,
          region_id,
          region_type,
          region_name,
          region_state,
          county_id,
          place_slug
        )
      VALUES
        ${sql.join(
          batch.map(
            (page) => sql`
              (
                ${tenantId},
                ${page.label},
                ${page.topicId},
                'live',
                ${page.region.id},
                ${page.region.type},
                ${page.region.name},
                ${page.region.state},
                ${page.region.countyId ?? null},
                ${page.placeSlug}
              )
            `,
          ),
          sql`, `,
        )}
      RETURNING
        id,
        topic_id,
        region_id
    `);
    for (const row of rows) {
      created.set(`${row.topic_id}|${row.region_id}`, Number(row.id));
    }
  }
  const idOf = (ref: PageRef) => {
    const id = 'id' in ref ? ref.id : created.get(ref.key);
    if (id === undefined) throw new Error(`No page for ${JSON.stringify(ref)}`);
    return id;
  };

  for (const change of plan.pageUpdates) {
    await tx.execute(sql`
      UPDATE lp_pages
      SET
        status = ${change.status},
        redirect_page_id = ${change.redirectPage
          ? idOf(change.redirectPage)
          : null},
        redirect_path = ${change.redirectPath},
        updated_at = now()
      WHERE
        id = ${change.id}
        AND tenant_id = ${tenantId}
    `);
  }

  for (const update of plan.slugUpdates) {
    await tx.execute(sql`
      UPDATE lp_slugs
      SET
        current = ${update.current},
        page_id = ${update.page ? idOf(update.page) : sql`page_id`},
        updated_at = now()
      WHERE
        id = ${update.id}
        AND tenant_id = ${tenantId}
    `);
  }

  for (const batch of chunks(plan.slugInserts)) {
    await tx.execute(sql`
      INSERT INTO
        lp_slugs (tenant_id, locale, path, current, page_id)
      VALUES
        ${sql.join(
          batch.map(
            (slug) => sql`
              (
                ${tenantId},
                ${slug.locale},
                ${slug.path},
                TRUE,
                ${idOf(slug.page)}
              )
            `,
          ),
          sql`, `,
        )}
    `);
  }
}

/** Plans and writes the tenant's landing pages; returns what changed. */
export async function generateLandingPages(
  tenantId: string,
): Promise<PlanSummary & { conflictList: string[] }> {
  const payload = await getPayloadSingleton();
  const plan = planGeneration(await loadInput(payload, tenantId));
  await db(payload).transaction((tx) => writePlan(tx, tenantId, plan));
  log.info(
    { event: 'landing_pages_generated', tenantId, ...plan.summary },
    'Landing pages generated',
  );
  if (plan.conflicts.length > 0) {
    log.warn(
      {
        event: 'landing_pages_conflicts',
        tenantId,
        conflicts: plan.conflicts.slice(0, 50),
      },
      'Landing page addresses skipped',
    );
  }
  return { ...plan.summary, conflictList: plan.conflicts.slice(0, 200) };
}

export type LandingGenerationStatus = {
  state: 'never' | 'queued' | 'running' | 'done' | 'failed';
  queuedAt?: string;
  completedAt?: string | null;
  summary?: PlanSummary | null;
  error?: string | null;
};

/** The tenant's latest generation run, for the Landing Pages tab. */
export async function getLandingGenerationStatus(
  tenantId: string,
): Promise<LandingGenerationStatus> {
  const payload = await getPayloadSingleton();
  const { docs } = await payload.find({
    collection: 'payload-jobs',
    where: { taskSlug: { equals: GENERATE_LANDING_PAGES_TASK } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  });
  const job = docs.find(
    (doc) => (doc.input as { tenantId?: string } | null)?.tenantId === tenantId,
  );
  if (!job) return { state: 'never' };
  const output = job.log?.findLast((entry) => entry.state === 'succeeded')
    ?.output as PlanSummary | undefined;
  return {
    state: job.hasError
      ? 'failed'
      : job.completedAt
        ? 'done'
        : job.processing
          ? 'running'
          : 'queued',
    queuedAt: job.createdAt,
    completedAt: job.completedAt ?? null,
    summary: output ?? null,
    error: job.hasError ? JSON.stringify(job.error ?? null) : null,
  };
}
