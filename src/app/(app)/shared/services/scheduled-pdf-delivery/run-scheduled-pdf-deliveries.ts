import type { Payload } from 'payload';

import { getUserPrintableDirectoryCapabilities } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { printableDirectoryDeliveriesInternalApiClient } from '@/lib/api/clients';
import {
  DuePrintableDirectoryDeliveryResponseDto,
  ReportPrintableDirectoryDeliveryResultDto,
} from '@/lib/api/generated/data-contracts';
import { createLogger } from '@/lib/logger';
import { Tenant } from '@/payload/payload-types';

import { deliverPrintableDirectoryPdf } from './deliver-printable-directory-pdf';
import {
  getInternalHeaders,
  loadDeliveryPreview,
} from './internal-delivery-api';
import { sendDeliveryFailureEmail } from './scheduled-pdf-delivery-email';
import {
  getTenantDeliveryContext,
  TenantDeliveryContextWithConfig,
} from './tenant-delivery-context';

const log = createLogger('runScheduledPdfDeliveries');

export type ScheduledPdfDeliveryStats = {
  tenants: number;
  due: number;
  sent: number;
  sentAsLink: number;
  skipped: number;
  failed: number;
};

async function reportResult(
  tenantId: string,
  deliveryId: string,
  result: ReportPrintableDirectoryDeliveryResultDto,
): Promise<void> {
  try {
    await printableDirectoryDeliveriesInternalApiClient.printableDirectoryDeliveryInternalControllerReportResult(
      { deliveryId, tenant_id: tenantId },
      result,
      { headers: await getInternalHeaders(tenantId), cache: 'no-store' },
    );
  } catch (error) {
    log.error(
      { err: error, tenantId, deliveryId },
      'Failed to record the delivery result',
    );
  }
}

/**
 * Sends every delivery due on `date` (docs/scheduled-pdf-delivery.md).
 * Tenants and deliveries are processed one at a time: rendering a PDF is
 * memory- and CPU-heavy, so nothing runs in parallel.
 */
export async function runScheduledPdfDeliveries(
  payload: Payload,
  date: string,
): Promise<ScheduledPdfDeliveryStats> {
  const stats: ScheduledPdfDeliveryStats = {
    tenants: 0,
    due: 0,
    sent: 0,
    sentAsLink: 0,
    skipped: 0,
    failed: 0,
  };

  const { docs: resourceDirectories } = await payload.find({
    collection: 'resource-directories',
    where: { 'featureFlags.enablePrintableDirectories': { equals: true } },
    depth: 1,
    limit: 1000,
    pagination: false,
  });

  for (const resourceDirectory of resourceDirectories) {
    const tenant =
      typeof resourceDirectory.tenant === 'object'
        ? (resourceDirectory.tenant as Tenant | null)
        : null;
    const host = tenant?.trustedDomains?.[0]?.domain;

    if (!tenant || !host) {
      log.warn(
        { resourceDirectoryId: resourceDirectory.id },
        'Skipping a resource directory without a tenant domain',
      );
      continue;
    }

    try {
      await runTenant(payload, tenant.id, host, date, stats);
    } catch (error) {
      log.error({ err: error, tenantId: tenant.id }, 'Tenant run failed');
    }
  }

  log.info({ date, ...stats }, 'Scheduled PDF delivery run finished');
  return stats;
}

async function runTenant(
  payload: Payload,
  tenantId: string,
  host: string,
  date: string,
  stats: ScheduledPdfDeliveryStats,
): Promise<void> {
  const context = await getTenantDeliveryContext(payload, host);

  if (context.tenantId !== tenantId) {
    log.warn({ tenantId, host }, 'Host resolves to another tenant; skipping');
    return;
  }

  const { appConfig } = context;
  const tenantOffersCapability = appConfig.printableDirectories.userGroups.some(
    (group) => group.capabilities.includes('scheduledPdfDelivery'),
  );
  if (
    !appConfig.featureFlags.enablePrintableDirectories ||
    !tenantOffersCapability
  ) {
    return;
  }

  stats.tenants += 1;

  const { data } =
    await printableDirectoryDeliveriesInternalApiClient.printableDirectoryDeliveryInternalControllerListDue(
      { date, tenant_id: tenantId },
      { headers: await getInternalHeaders(tenantId), cache: 'no-store' },
    );

  stats.due += data.items.length;

  for (const delivery of data.items) {
    try {
      await runDelivery(context, delivery, date, stats);
    } catch (error) {
      stats.failed += 1;
      log.error(
        { err: error, tenantId, deliveryId: delivery.id },
        'Delivery run failed',
      );
    }
  }
}

async function runDelivery(
  context: TenantDeliveryContextWithConfig,
  delivery: DuePrintableDirectoryDeliveryResponseDto,
  date: string,
  stats: ScheduledPdfDeliveryStats,
): Promise<void> {
  const { tenantId } = context;

  const { data: claim } =
    await printableDirectoryDeliveriesInternalApiClient.printableDirectoryDeliveryInternalControllerClaim(
      { deliveryId: delivery.id, tenant_id: tenantId },
      { date },
      { headers: await getInternalHeaders(tenantId), cache: 'no-store' },
    );
  if (!claim.claimed) {
    return;
  }

  // Capabilities can be revoked after a schedule is created.
  const creatorCapabilities = getUserPrintableDirectoryCapabilities(
    delivery.createdByEmail,
    context.appConfig,
  );
  if (!creatorCapabilities.has('scheduledPdfDelivery')) {
    stats.skipped += 1;
    await reportResult(tenantId, delivery.id, {
      date,
      status: 'skipped',
      reason: 'capability_revoked',
    });
    return;
  }

  const outcome = await deliverPrintableDirectoryPdf({
    context,
    delivery,
    directory: delivery.directory,
    date,
    loadPreview: (locale) => loadDeliveryPreview(tenantId, delivery.id, locale),
  });

  if (outcome.status === 'failed' || outcome.status === 'skipped') {
    // Nothing reached the recipients: record why and tell the creator.
    if (outcome.status === 'failed') {
      stats.failed += 1;
    } else {
      stats.skipped += 1;
    }
    await reportResult(tenantId, delivery.id, {
      date,
      status: outcome.status,
      reason: outcome.reason,
    });

    try {
      await sendDeliveryFailureEmail({
        payload: context.payload,
        locale: outcome.locale,
        defaultLocale: context.defaultLocale,
        brandName: context.brandName,
        creatorEmail: delivery.createdByEmail,
        title: outcome.title,
        date,
        reason: outcome.reason,
        directoryUrl: `${context.baseUrl}/${outcome.locale}/directories/${delivery.directory.id}`,
      });
    } catch (error) {
      log.error(
        { err: error, tenantId, deliveryId: delivery.id },
        'Failed to send the not-sent notice',
      );
    }
    return;
  }

  if (outcome.status === 'sent') {
    stats.sent += 1;
  } else {
    stats.sentAsLink += 1;
  }
  await reportResult(tenantId, delivery.id, { date, status: outcome.status });
}
