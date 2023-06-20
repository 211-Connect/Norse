import { Router } from 'express';
import z from 'zod';
import { ShortenedUrl } from '../models/ShortenedUrl';
import { nanoid } from 'nanoid';
import { URL } from 'url';
import { cacheControl } from '../lib/cacheControl';

const router = Router();

const urlShortenerSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
});
router.get('/:id', async (req, res) => {
  try {
    const { id, tenant_id } = await urlShortenerSchema.parseAsync(req.params);

    const shortenedUrl = await ShortenedUrl.findOne({
      shortId: id,
      tenantId: tenant_id,
    });

    if (!shortenedUrl) return res.sendStatus(404);

    cacheControl(res);
    res.json({
      url: shortenedUrl.originalUrl,
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(400);
  }
});

const newShortenedUrlSchema = z.object({
  url: z.string().url(),
});
router.post('/', async (req, res) => {
  try {
    const { url } = await newShortenedUrlSchema.parseAsync(req.body);

    const shortenedUrl = await ShortenedUrl.findOne({
      originalUrl: url,
      tenantId: req.tenant.tenantId,
    });

    if (shortenedUrl) {
      const origin = new URL(shortenedUrl?.originalUrl);
      return res.json({
        url: `${origin.protocol}//${origin.host}/api/share/${shortenedUrl.shortId}`,
      });
    }

    const newShortenedUrl = new ShortenedUrl({
      originalUrl: url,
      shortId: nanoid(12),
      tenantId: req.tenant.tenantId,
    });

    await newShortenedUrl.save();

    const origin = new URL(newShortenedUrl?.originalUrl);

    res.json({
      url: `${origin.protocol}//${origin.host}/api/share/${newShortenedUrl.shortId}`,
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(400);
  }
});

export default router;
