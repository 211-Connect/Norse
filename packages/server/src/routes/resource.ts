import { Router } from 'express';
import z from 'zod';
import { Resource } from '../models/Resource';
import { cacheControl } from '../lib/cacheControl';
import { Redirect } from '../models/Redirect';
import { logger } from '../lib/winston';

const router = Router();

const resourceByIdSchema = z.object({
  id: z.string(),
});
const resourceQuerySchema = z.object({
  locale: z.string().default('en'),
});
router.get('/:id', async (req, res) => {
  try {
    const { id } = await resourceByIdSchema.parseAsync(req.params);
    const { locale } = await resourceQuerySchema.parseAsync(req.query);

    const resource = await Resource.findById(id, {
      noop: 0,
      translations: {
        $elemMatch: {
          locale: locale,
        },
      },
    });

    // If the resource wasn't found, we should check to see if a redirect exists
    // for this resource. If it does, we should redirect the user to the new
    // resource.
    if (!resource) {
      const redirect = await Redirect.findById(id);

      if (redirect) {
        cacheControl(res);
        return res.status(404).json({
          redirect: `/search/${redirect.newId}`,
        });
      }
    }

    // If the resource wasn't found, or if there are no translations for the
    // resource, we should return a 404.
    if (!resource || resource.translations.length === 0)
      return res.sendStatus(404);

    const newV = resource.toJSON() as any;
    newV.translation = resource.translations[0];

    cacheControl(res);
    res.json(newV);
  } catch (err) {
    logger.error('Resource get by id error', err);
    res.sendStatus(400);
  }
});

export default router;
