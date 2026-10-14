import { createInstance, type TFunction } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import type { Payload } from 'payload';

/**
 * Emails sent by scheduled PDF delivery (docs/scheduled-pdf-delivery.md),
 * through Payload's email adapter (SendGrid when `SENDGRID_API_KEY` is set,
 * Payload's console fallback otherwise).
 */

/** Largest PDF sent as an attachment; SendGrid allows ~30 MB per message
 *  and base64 adds about a third. Larger PDFs are sent as a link. */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export type DeliveryFailureReason =
  | 'preview_failed'
  | 'render_failed'
  | 'send_failed'
  | 'too_large_without_share_link';

type EmailLocaleOptions = {
  locale: string;
  defaultLocale: string;
};

/**
 * Email copy in the delivery's language, falling back to the tenant's
 * default. A plain i18next instance: this runs in server code where
 * react-i18next (React context) isn't available.
 */
async function getTranslator({
  locale,
  defaultLocale,
}: EmailLocaleOptions): Promise<TFunction> {
  const instance = createInstance();
  instance.use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/../public/locales/${language}/${namespace}.json`),
    ),
  );

  await instance.init({
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: [locale, defaultLocale],
    ns: ['page-directories'],
    defaultNS: 'page-directories',
    preload: [locale, defaultLocale],
  });

  return instance.getFixedT(locale, 'page-directories');
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function getFrom(payload: Payload, brandName: string): string | undefined {
  const address = payload.email?.defaultFromAddress;
  if (!address) return undefined;

  const name = brandName ? `${brandName} via Connect 211` : 'Connect 211';
  return `"${name.replace(/"/g, '')}" <${address}>`;
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2933">${paragraph}</p>`,
    )
    .join('');
}

function renderLink(url: string, label: string): string {
  return `<a href="${escapeHtml(url)}" style="color:#0b5cad">${escapeHtml(label)}</a>`;
}

export function formatDeliveryDate(date: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
  } catch {
    return date;
  }
}

type SendDeliveryEmailOptions = EmailLocaleOptions & {
  payload: Payload;
  brandName: string;
  /** The schedule's creator: To and Reply-To. */
  creatorEmail: string;
  /** BCC'd so recipients don't see each other; empty for a test send. */
  recipients: string[];
  title: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** Attached when set; otherwise `shareUrl` is linked. */
  pdf?: { bytes: Uint8Array; fileName: string };
  shareUrl?: string;
  isTest?: boolean;
};

export async function sendDeliveryEmail({
  payload,
  brandName,
  creatorEmail,
  recipients,
  title,
  date,
  pdf,
  shareUrl,
  isTest = false,
  ...localeOptions
}: SendDeliveryEmailOptions): Promise<void> {
  const t = await getTranslator(localeOptions);
  const formattedDate = formatDeliveryDate(date, localeOptions.locale);
  const subject = t('scheduled_delivery_email_subject', {
    title,
    date: formattedDate,
    interpolation: { escapeValue: false },
  });

  const paragraphs = [
    escapeHtml(
      t('scheduled_delivery_email_intro', {
        title,
        date: formattedDate,
        interpolation: { escapeValue: false },
      }),
    ),
    pdf
      ? escapeHtml(t('scheduled_delivery_email_attached'))
      : `${escapeHtml(t('scheduled_delivery_email_too_large'))} ${renderLink(
          shareUrl ?? '',
          t('scheduled_delivery_email_download'),
        )}`,
    ...(isTest ? [escapeHtml(t('scheduled_delivery_email_test_note'))] : []),
    `<span style="color:#616e7c;font-size:13px">${escapeHtml(
      t('scheduled_delivery_email_footer', {
        email: creatorEmail,
        interpolation: { escapeValue: false },
      }),
    )}</span>`,
  ];

  await payload.sendEmail({
    from: getFrom(payload, brandName),
    to: creatorEmail,
    bcc: recipients.length > 0 ? recipients : undefined,
    replyTo: creatorEmail,
    subject: isTest
      ? `[${t('scheduled_delivery_test_label')}] ${subject}`
      : subject,
    html: renderParagraphs(paragraphs),
    attachments: pdf
      ? [
          {
            filename: pdf.fileName,
            content: Buffer.from(pdf.bytes),
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}

type SendDeliveryFailureEmailOptions = EmailLocaleOptions & {
  payload: Payload;
  brandName: string;
  creatorEmail: string;
  title: string;
  date: string;
  reason: DeliveryFailureReason;
  directoryUrl: string;
};

/** Tells the schedule's creator that a delivery couldn't be sent. */
export async function sendDeliveryFailureEmail({
  payload,
  brandName,
  creatorEmail,
  title,
  date,
  reason,
  directoryUrl,
  ...localeOptions
}: SendDeliveryFailureEmailOptions): Promise<void> {
  const t = await getTranslator(localeOptions);
  const formattedDate = formatDeliveryDate(date, localeOptions.locale);

  await payload.sendEmail({
    from: getFrom(payload, brandName),
    to: creatorEmail,
    subject: t('scheduled_delivery_failure_subject', {
      title,
      interpolation: { escapeValue: false },
    }),
    html: renderParagraphs([
      escapeHtml(
        t('scheduled_delivery_failure_intro', {
          title,
          date: formattedDate,
          interpolation: { escapeValue: false },
        }),
      ),
      escapeHtml(t(`scheduled_delivery_reason_${reason}`)),
      renderLink(directoryUrl, t('scheduled_delivery_failure_open_directory')),
    ]),
  });
}
