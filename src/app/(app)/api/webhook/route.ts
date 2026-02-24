import { NextResponse } from 'next/server';
import z from 'zod';
import { cookies } from 'next/headers';
import { getCookie } from 'cookies-next/server';
import { SESSION_ID } from '@/app/(app)/shared/lib/constants';
import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import { createLogger } from '@/lib/logger';

const log = createLogger('webhook');

const bodySchema = z.object({
  message: z.string(),
  brandName: z.string().optional().default('Unknown App'),
  faviconUrl: z.string().optional().default(''),
  url: z.string().optional().default(''),
  openGraphUrl: z.string().optional().default(''),
  hostname: z.string().optional().default('Unknown Host'),
});

export async function POST(request: Request) {
  const sessionId = await getCookie(SESSION_ID, { cookies });

  if (process.env.WEBHOOK_ALERT_URL == null || sessionId == null) {
    return NextResponse.json('Done', { status: 200 });
  }

  let body: any = {};
  try {
    body = await request.json();
    log.debug({ body }, 'Webhook received');

    const validated = await bodySchema.parseAsync(body);

    log.debug(
      { tenantHostname: validated.hostname },
      'Webhook payload validated',
    );

    await fetchWrapper(`${process.env.WEBHOOK_ALERT_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        embeds: [
          {
            title: 'An unhandled error has occurred',
            description: validated.message,
            author: {
              name: validated.brandName,
              icon_url: validated.faviconUrl || undefined,
            },
            url: validated.url || undefined,
            image: validated.openGraphUrl
              ? { url: validated.openGraphUrl }
              : undefined,
            timestamp: new Date().toISOString(),
            footer: { text: validated.hostname },
            color: 0xff0000,
          },
        ],
      },
    });

    log.info({ hostname: validated.hostname }, 'Webhook forwarded to Discord');
  } catch (error: any) {
    log.error({ err: error }, 'Webhook handler error');

    if (error instanceof z.ZodError) {
      log.warn(
        { errors: error.errors },
        'Webhook Zod validation failed; sending fallback',
      );

      try {
        await fetchWrapper(`${process.env.WEBHOOK_ALERT_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            embeds: [
              {
                title: 'Frontend Error (Incomplete Data)',
                description: `An error occurred but some required fields were missing. Message: ${body?.message || 'No message provided'}`,
                color: 0xffa500,
                timestamp: new Date().toISOString(),
                footer: { text: body?.hostname || 'Unknown Host' },
              },
            ],
          },
        });
        log.info('Fallback webhook sent to Discord');
      } catch (fallbackError) {
        log.error({ err: fallbackError }, 'Failed to send fallback webhook');
      }
    } else {
      log.error({ err: error }, 'Non-Zod error in webhook handler');
    }
  }

  return NextResponse.json('Done', { status: 200 });
}
