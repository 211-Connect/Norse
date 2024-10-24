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
  if (process.env.WEBHOOK_ALERT_URL != null && sessionId != null) {
    const bodySchema = z.object({
      message: z.string(),
      brandName: z.string(),
      faviconUrl: z.string(),
      url: z.string(),
      openGraphUrl: z.string(),
      hostname: z.string(),
    });

    const body = await bodySchema.parseAsync(req.body);

    try {
      await axios.post(`${process.env.WEBHOOK_ALERT_URL}`, {
        embeds: [
          {
            title: 'An unhandled error has occurred',
            description: body.message,
            author: {
              name: body.brandName,
              icon_url: body.faviconUrl,
            },
            url: body.url,
            image: {
              url: body.openGraphUrl,
            },
            timestamp: new Date(),
            footer: {
              text: body.hostname,
            },
          },
        ],
      });
    } catch (err) {
      console.log('unable to send webhook request.');
    }
  }

  res.statusCode = 200;
  res.send('Done');
};

export default Webhook;
