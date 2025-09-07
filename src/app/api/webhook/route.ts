import { NextResponse } from 'next/server';
import axios from 'axios';
import z from 'zod';
import { cookies } from 'next/headers';
import { getCookie } from 'cookies-next/server';
import { SESSION_ID } from '@/app/shared/lib/constants';

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
    console.log('Webhook received payload:', JSON.stringify(body, null, 2));

    const validated = await bodySchema.parseAsync(body);

    console.log(
      'Webhook validated payload:',
      JSON.stringify(validated, null, 2),
    );

    await axios.post(`${process.env.WEBHOOK_ALERT_URL}`, {
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
    });

    console.log('Successfully sent webhook to Discord');
  } catch (error: any) {
    console.error('Webhook error:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation failed:', error.errors);

      try {
        await axios.post(`${process.env.WEBHOOK_ALERT_URL}`, {
          embeds: [
            {
              title: 'Frontend Error (Incomplete Data)',
              description: `An error occurred but some required fields were missing. Message: ${body?.message || 'No message provided'}`,
              color: 0xffa500,
              timestamp: new Date().toISOString(),
              footer: { text: body?.hostname || 'Unknown Host' },
            },
          ],
        });
        console.log('Sent fallback webhook to Discord');
      } catch (fallbackError) {
        console.error('Failed to send fallback webhook:', fallbackError);
      }
    } else {
      console.error('Non-Zod error in webhook:', error);
    }
  }

  return NextResponse.json('Done', { status: 200 });
}
