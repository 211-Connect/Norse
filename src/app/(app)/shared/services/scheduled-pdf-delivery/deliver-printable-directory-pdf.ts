import type { Payload } from 'payload';

import {
  PD_BOOKLET_PARAM,
  PD_FONT_SIZE_PARAM,
  PD_SLUG_PARAM,
  PD_VARIANT_PARAM,
} from '@/app/(app)/shared/components/directory-print/share-link-params';
import { getPrintableDirectoryLocalizedText } from '@/app/(app)/features/printable-directories/utils/getPrintableDirectoryLocalizedText';
import {
  DuePrintableDirectoryDeliveryDirectoryDto,
  PrintableDirectoryDeliveryResponseDto,
  PrintableDirectoryPreviewResponseDto,
} from '@/lib/api/generated/data-contracts';
import { createLogger } from '@/lib/logger';

import { requestPrintableDirectoryPdf } from './request-printable-directory-pdf';
import {
  DeliveryFailureReason,
  MAX_ATTACHMENT_BYTES,
  sendDeliveryEmail,
} from './scheduled-pdf-delivery-email';

const log = createLogger('deliverPrintableDirectoryPdf');

/** What a delivery needs to know about its tenant, resolved once per run. */
export type TenantDeliveryContext = {
  payload: Payload;
  tenantId: string;
  /** Origin plus custom base path, e.g. `https://example.org`. */
  baseUrl: string;
  /** Host plus custom base path, printed in the PDF header/footer. */
  domain: string;
  brandName: string;
  brandLogoUrl?: string;
  defaultLocale: string;
};

export type DeliveryOutcome =
  | { status: 'sent' | 'sent_as_link'; locale: string; title: string }
  | {
      status: 'failed';
      reason: DeliveryFailureReason;
      locale: string;
      title: string;
    }
  | {
      /** Nothing to send: the directory resolved to no resources. */
      status: 'skipped';
      reason: 'empty';
      locale: string;
      title: string;
    };

type DeliverPrintableDirectoryPdfOptions = {
  context: TenantDeliveryContext;
  delivery: Pick<
    PrintableDirectoryDeliveryResponseDto,
    'id' | 'print' | 'recipients' | 'createdByEmail'
  >;
  directory: DuePrintableDirectoryDeliveryDirectoryDto;
  /** `YYYY-MM-DD` in the delivery time zone. */
  date: string;
  loadPreview: (
    locale: string,
  ) => Promise<PrintableDirectoryPreviewResponseDto | null>;
  /** A "Send to me now" test: only `testRecipient` gets it. */
  testRecipient?: string;
};

/** The delivery's language, or the primary one if it was removed. */
export function resolveDeliveryLocale(
  locale: string,
  directory: Pick<
    DuePrintableDirectoryDeliveryDirectoryDto,
    'locales' | 'primaryLanguage'
  >,
): string {
  return directory.locales.includes(locale)
    ? locale
    : directory.primaryLanguage;
}

/** Makes a site-relative media URL absolute; Node can't fetch relative ones. */
export function toAbsoluteUrl(
  url: string | null | undefined,
  baseUrl: string,
): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return new URL(url, `${baseUrl}/`).toString();
}

function withAbsoluteImageUrls(
  preview: PrintableDirectoryPreviewResponseDto,
  baseUrl: string,
): PrintableDirectoryPreviewResponseDto {
  return {
    ...preview,
    logoUrl: toAbsoluteUrl(preview.logoUrl, baseUrl) ?? null,
    cover: {
      ...preview.cover,
      coverImageUrlFront:
        toAbsoluteUrl(preview.cover.coverImageUrlFront, baseUrl) ?? null,
      coverImageUrlBack:
        toAbsoluteUrl(preview.cover.coverImageUrlBack, baseUrl) ?? null,
    },
  };
}

function toFileName(slugOrName: string, date: string): string {
  const base = slugOrName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'directory'}-${date}.pdf`;
}

/** `MM/DD/YYYY`, as the print dialog prints it. */
function toPrintedDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${month}/${day}/${year}`;
}

export function buildDeliveryShareUrl(
  baseUrl: string,
  locale: string,
  slug: string,
  print: PrintableDirectoryDeliveryResponseDto['print'],
): string {
  const params = new URLSearchParams({
    [PD_SLUG_PARAM]: slug,
    [PD_VARIANT_PARAM]: print.variant,
    [PD_FONT_SIZE_PARAM]: print.fontSize,
    [PD_BOOKLET_PARAM]: String(print.booklet),
  });

  return `${baseUrl}/${locale}?${params.toString()}`;
}

/**
 * Renders one delivery's PDF and emails it: attached when small enough,
 * otherwise as a share link. Never throws; failures come back as an outcome.
 */
export async function deliverPrintableDirectoryPdf({
  context,
  delivery,
  directory,
  date,
  loadPreview,
  testRecipient,
}: DeliverPrintableDirectoryPdfOptions): Promise<DeliveryOutcome> {
  const locale = resolveDeliveryLocale(delivery.print.locale, directory);
  const print = { ...delivery.print, locale };
  const logContext = {
    tenantId: context.tenantId,
    deliveryId: delivery.id,
    directoryId: directory.id,
  };

  let title = directory.name;
  const failed = (reason: DeliveryFailureReason): DeliveryOutcome => ({
    status: 'failed',
    reason,
    locale,
    title,
  });

  let preview: PrintableDirectoryPreviewResponseDto | null;
  try {
    preview = await loadPreview(locale);
  } catch (error) {
    log.error({ ...logContext, err: error }, 'Preview request failed');
    preview = null;
  }
  if (!preview) {
    return failed('preview_failed');
  }

  title =
    getPrintableDirectoryLocalizedText(
      preview.cover.titleLocalized,
      locale,
      preview.primaryLanguage,
    ) || preview.name;

  const resourceCount = preview.sections.reduce(
    (total, section) => total + section.resources.length,
    0,
  );
  if (resourceCount === 0) {
    log.info(logContext, 'Directory has no resources; not sending');
    return { status: 'skipped', reason: 'empty', locale, title };
  }

  let bytes: Uint8Array;
  try {
    const startedAt = Date.now();
    bytes = await requestPrintableDirectoryPdf({
      preview: withAbsoluteImageUrls(preview, context.baseUrl),
      print,
      defaultLocale: context.defaultLocale,
      currentDomain: context.domain,
      currentDate: toPrintedDate(date),
      brandLogoUrl: context.brandLogoUrl,
    });
    log.info(
      { ...logContext, renderMs: Date.now() - startedAt, bytes: bytes.length },
      'Rendered PDF',
    );
  } catch (error) {
    log.error({ ...logContext, err: error }, 'PDF render failed');
    return failed('render_failed');
  }

  const attach = bytes.length <= MAX_ATTACHMENT_BYTES;
  if (!attach && !directory.slug) {
    return failed('too_large_without_share_link');
  }

  try {
    await sendDeliveryEmail({
      payload: context.payload,
      locale,
      defaultLocale: context.defaultLocale,
      brandName: context.brandName,
      creatorEmail: testRecipient ?? delivery.createdByEmail,
      recipients: testRecipient ? [] : delivery.recipients,
      title,
      date,
      pdf: attach
        ? {
            bytes,
            fileName: toFileName(directory.slug ?? directory.name, date),
          }
        : undefined,
      shareUrl: attach
        ? undefined
        : buildDeliveryShareUrl(
            context.baseUrl,
            locale,
            directory.slug as string,
            print,
          ),
      isTest: Boolean(testRecipient),
    });
  } catch (error) {
    log.error({ ...logContext, err: error }, 'Sending the email failed');
    return failed('send_failed');
  }

  return { status: attach ? 'sent' : 'sent_as_link', locale, title };
}
