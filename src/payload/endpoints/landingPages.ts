import type { Endpoint, PayloadRequest } from 'payload';

import { createLogger } from '@/lib/logger';
import { locales } from '@/payload/i18n/locales';
import { getLandingCopyContext } from '@/payload/services/landingCopy';
import { exportLandingPagesCsv } from '@/payload/services/landingPagesAdmin';
import {
  GENERATE_LANDING_PAGES_TASK,
  LandingGenerationError,
  getLandingGenerationStatus,
  previewLandingPages,
} from '@/payload/services/landingPagesGeneration';
import {
  getStateRegions,
  normalizeStateCode,
} from '@/payload/services/stateRegions';

import {
  isSuperAdmin,
  isSupport,
  isTenant,
} from '../collections/Users/access/roles';

const log = createLogger('landing-pages-endpoints');

const LOCALES = new Set<string>(locales);
const isLocale = (value: string) => LOCALES.has(value);

/**
 * Admin endpoints of the Landing Pages tab (docs/landing-pages.md), under
 * `/api/landing-pages/admin/*`. Every one takes `tenantId` and checks that
 * the user may manage that tenant.
 */

type Guarded = { tenantId: string } | Response;

function guard(req: PayloadRequest, tenantId: unknown): Guarded {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  if (typeof tenantId !== 'string' || !tenantId) {
    return Response.json({ message: 'tenantId is required' }, { status: 400 });
  }
  if (isSuperAdmin(req.user) || isSupport(req.user)) return { tenantId };
  if (!isTenant(req.user)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }
  const own = (req.user.tenants ?? []).map((t) =>
    typeof t === 'string'
      ? t
      : typeof t.tenant === 'string'
        ? t.tenant
        : t.tenant.id,
  );
  return own.includes(tenantId)
    ? { tenantId }
    : Response.json({ message: 'Forbidden' }, { status: 403 });
}

const query = (req: PayloadRequest, name: string) =>
  new URL(req.url ?? 'http://x').searchParams.get(name);

const failed = (error: unknown, tenantId: string, what: string) => {
  if (error instanceof LandingGenerationError) {
    return Response.json({ message: error.message }, { status: 409 });
  }
  log.error({ err: error, tenantId }, `Landing pages ${what} failed`);
  return Response.json({ message: `${what} failed` }, { status: 500 });
};

/** GET ?tenantId=&state=WA → the state's counties and places. */
const regions: Endpoint = {
  path: '/admin/regions',
  method: 'get',
  handler: async (req) => {
    const checked = guard(req, query(req, 'tenantId'));
    if (checked instanceof Response) return checked;
    const state = normalizeStateCode(query(req, 'state') ?? '');
    if (!state) {
      return Response.json(
        { message: 'state must be a postal code' },
        { status: 400 },
      );
    }
    try {
      return Response.json({
        items: await getStateRegions(state, checked.tenantId),
      });
    } catch (error) {
      log.error({ err: error, state }, 'Listing state regions failed');
      return Response.json(
        {
          message:
            'The region list could not be loaded. Try again in a minute.',
        },
        { status: 502 },
      );
    }
  },
};

/** GET ?tenantId= → counts and the last generation run, for the summary card. */
const summary: Endpoint = {
  path: '/admin/summary',
  method: 'get',
  handler: async (req) => {
    const checked = guard(req, query(req, 'tenantId'));
    if (checked instanceof Response) return checked;
    const { tenantId } = checked;
    const [{ totalDocs: livePages }, tenant, counted, latest, generation] =
      await Promise.all([
        req.payload.count({
          collection: 'landing-pages',
          where: {
            and: [
              { tenant: { equals: tenantId } },
              { status: { equals: 'live' } },
            ],
          },
        }),
        req.payload.findByID({ collection: 'tenants', id: tenantId, depth: 0 }),
        req.payload.find({
          collection: 'landing-pages',
          where: {
            and: [
              { tenant: { equals: tenantId } },
              { countedAt: { exists: true } },
            ],
          },
          sort: '-countedAt',
          limit: 1,
          depth: 0,
          select: { countedAt: true },
        }),
        req.payload.find({
          collection: 'landing-pages',
          where: { tenant: { equals: tenantId } },
          sort: '-updatedAt',
          limit: 1,
          depth: 0,
          select: { updatedAt: true },
        }),
        getLandingGenerationStatus(tenantId),
      ]);
    return Response.json({
      livePages,
      locales: (tenant.enabledLocales ?? []).length,
      lastCountedAt: counted.docs[0]?.countedAt ?? null,
      // Jobs are deleted when they finish, so the newest page write stands
      // in for the last completed run.
      lastGeneratedAt:
        generation.completedAt ?? latest.docs[0]?.updatedAt ?? null,
      generation,
    });
  },
};

/** POST { tenantId } → what Apply changes would do, from the saved settings. */
const preview: Endpoint = {
  path: '/admin/preview',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { tenantId?: string } | undefined;
    const checked = guard(req, body?.tenantId);
    if (checked instanceof Response) return checked;
    try {
      const plan = await previewLandingPages(checked.tenantId);
      return Response.json({
        summary: plan.summary,
        conflicts: plan.conflicts.slice(0, 20),
      });
    } catch (error) {
      return failed(error, checked.tenantId, 'Preview');
    }
  },
};

/** POST { tenantId } → queues the generation job. */
const apply: Endpoint = {
  path: '/admin/apply',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { tenantId?: string } | undefined;
    const checked = guard(req, body?.tenantId);
    if (checked instanceof Response) return checked;
    const { tenantId } = checked;
    const current = await getLandingGenerationStatus(tenantId);
    if (current.state === 'queued' || current.state === 'running') {
      return Response.json(
        { message: 'Pages are already being generated.' },
        { status: 409 },
      );
    }
    const job = await req.payload.jobs.queue({
      task: GENERATE_LANDING_PAGES_TASK as 'generateLandingPages',
      input: { tenantId },
      queue: 'landingPages',
    });
    log.info(
      { tenantId, jobId: job.id, userId: req.user?.id },
      'Landing page generation queued',
    );
    return Response.json({ jobId: job.id });
  },
};

/**
 * GET ?tenantId=&locale=&pageId=&topicId= → what copy previews are filled
 * from: the inherited layers, tag values and the page's address.
 */
const copyContext: Endpoint = {
  path: '/admin/copy-context',
  method: 'get',
  handler: async (req) => {
    const checked = guard(req, query(req, 'tenantId'));
    if (checked instanceof Response) return checked;
    const locale = query(req, 'locale') || 'en';
    if (!isLocale(locale)) {
      return Response.json({ message: 'Unknown locale' }, { status: 400 });
    }
    const pageId = query(req, 'pageId');
    const topicId = query(req, 'topicId');
    if ([pageId, topicId].some((id) => id && !/^\d+$/.test(id))) {
      return Response.json(
        { message: 'pageId and topicId are numbers' },
        { status: 400 },
      );
    }
    try {
      return Response.json(
        await getLandingCopyContext({
          tenantId: checked.tenantId,
          locale,
          pageId,
          topicId,
        }),
      );
    } catch (error) {
      return failed(error, checked.tenantId, 'Copy preview');
    }
  },
};

/** GET ?tenantId= → every page of the tenant as a CSV download. */
const exportCsv: Endpoint = {
  path: '/admin/export',
  method: 'get',
  handler: async (req) => {
    const checked = guard(req, query(req, 'tenantId'));
    if (checked instanceof Response) return checked;
    try {
      const csv = await exportLandingPagesCsv(checked.tenantId);
      const date = new Date().toISOString().slice(0, 10);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="landing-pages-${date}.csv"`,
        },
      });
    } catch (error) {
      return failed(error, checked.tenantId, 'Export');
    }
  },
};

export const landingPagesEndpoints: Endpoint[] = [
  copyContext,
  exportCsv,
  regions,
  summary,
  preview,
  apply,
];
