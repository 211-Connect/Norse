import { type NextApiHandler } from 'next';
import axios from 'axios';
import nookies from 'nookies';
import z from 'zod';

const Webhook: NextApiHandler = async (req, res) => {
  switch (req.method) {
    case 'POST':
      return await POST(req, res);
    default:
      res.statusCode = 404;
      res.send('Not found');
  }
};

const POST: NextApiHandler = async (req, res) => {
  const cookies = nookies.get({ req });
  const sessionId = cookies['session-id'];

  if (process.env.WEBHOOK_ALERT_URL == null || sessionId == null) {
    res.statusCode = 200;
    res.send('Done');
    return;
  }

  const bodySchema = z.object({
    message: z.string(),
    brandName: z.string().optional().default('Unknown App'),
    faviconUrl: z.string().optional().default(''),
    url: z.string().optional().default(''),
    openGraphUrl: z.string().optional().default(''),
    hostname: z.string().optional().default('Unknown Host'),
  });

  try {
    // Log the received payload for debugging purposes
    console.log('Webhook received payload:', JSON.stringify(req.body, null, 2));

    const body = await bodySchema.parseAsync(req.body);

    console.log('Webhook validated payload:', JSON.stringify(body, null, 2));

    // Send to Discord webhook
    await axios.post(`${process.env.WEBHOOK_ALERT_URL}`, {
      embeds: [
        {
          title: 'An unhandled error has occurred',
          description: body.message,
          author: {
            name: body.brandName,
            icon_url: body.faviconUrl || undefined,
          },
          url: body.url || undefined,
          image: body.openGraphUrl
            ? {
                url: body.openGraphUrl,
              }
            : undefined,
          timestamp: new Date().toISOString(),
          footer: {
            text: body.hostname,
          },
          color: 0xff0000, // Red color for errors
        },
      ],
    });

    console.log('Successfully sent webhook to Discord');
  } catch (error) {
    console.error('Webhook error:', error);

    // If it's a Zod validation error, log the specific issues
    if (error instanceof z.ZodError) {
      console.error('Zod validation failed:', error.errors);

      // Send a simplified error notification to Discord anyway
      try {
        await axios.post(`${process.env.WEBHOOK_ALERT_URL}`, {
          embeds: [
            {
              title: 'Frontend Error (Incomplete Data)',
              description: `An error occurred but some required fields were missing. Message: ${req.body?.message || 'No message provided'}`,
              color: 0xffa500, // Orange color for warnings
              timestamp: new Date().toISOString(),
              footer: {
                text: req.body?.hostname || 'Unknown Host',
              },
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

  res.statusCode = 200;
  res.send('Done');
};

export default Webhook;
