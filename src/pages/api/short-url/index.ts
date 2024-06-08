import { mongodb } from '@/lib/mongodb';
import { NextApiHandler } from 'next';
import z from 'zod';
import { nanoid } from 'nanoid';

const FavoriteListHandler: NextApiHandler = async (req, res) => {
  if (req.method === 'POST') {
    const newShortenedUrlSchema = z.object({
      url: z.string().url(),
    });

    const body = await newShortenedUrlSchema.parseAsync(req.body);

    const shortenedUrl = await mongodb.shortenedUrl.findFirst({
      where: {
        originalUrl: body.url,
      },
    });

    if (shortenedUrl) {
      const origin = new URL(shortenedUrl?.originalUrl);
      return res.json({
        url: `${origin.protocol}//${origin.host}/api/share/${shortenedUrl.shortId}`,
      });
    }

    const newShortId = nanoid(12);
    await mongodb.shortenedUrl.create({
      data: {
        originalUrl: body.url,
        shortId: newShortId,
      },
    });

    const origin = new URL(body.url);

    res.status(200).json({
      url: `${origin.protocol}//${origin.host}/api/share/${newShortId}`,
    });
    return;
  } else {
    res.status(404);
    return;
  }
};

export default FavoriteListHandler;
