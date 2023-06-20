import { Router } from 'express';
import { FavoriteList } from '../models/FavoriteList';
import { authorizeMiddleware } from '../middleware/authorize';
import z from 'zod';
import { logger } from '../lib/winston';

const router = Router();

const localeQuerySchema = z.object({
  locale: z.string().default('en'),
});
router.get('/', authorizeMiddleware(), async (req, res) => {
  const favoriteLists = await FavoriteList.find({
    ownerId: req.user.id,
  })
    .select('name description privacy')
    .limit(20);

  res.json(favoriteLists);
});

const allFavoriteListsSchema = z.object({
  exclude: z.string().optional(),
  name: z.string().optional(),
});
router.get('/search', authorizeMiddleware(), async (req, res) => {
  const query = await allFavoriteListsSchema.parseAsync(req.query);

  const mongoQuery: any = {
    ownerId: req.user.id,
    favorites: { $nin: query.exclude },
  };

  if (query.name) mongoQuery.name = { $regex: query.name, $options: 'i' };

  const favoriteLists = await FavoriteList.find(mongoQuery)
    .select('name description privacy')
    .limit(20);

  res.json(favoriteLists);
});

router.get('/:id', async (req, res) => {
  const { locale } = await localeQuerySchema.parseAsync(req.query);
  const favoriteList = await FavoriteList.findById(req.params.id).populate({
    path: 'favorites',
    model: 'resource',
    select: '-serviceArea',
    transform: (doc: any) => {
      if (!doc) return null;

      const translation = doc.translations.find(
        (el: any) => el.locale === locale
      );

      doc.translations = [];

      if (translation) doc.translations.push(translation);

      return doc;
    },
  });

  if (!favoriteList) return res.sendStatus(404);

  favoriteList.favorites = favoriteList.favorites.filter(
    (el: any) => el != null
  );

  if (favoriteList.privacy === 'PRIVATE') {
    // We invoke authorize middleware manually here ONLY if the list is set to private
    return authorizeMiddleware()(req, res, function () {
      return res.json(favoriteList);
    });
  }

  // List is assumed to be public if it is not private
  res.json(favoriteList);
});

const NewFavoriteSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2048).optional(),
  public: z.boolean().default(false),
});
router.post('/', authorizeMiddleware(), async (req, res) => {
  try {
    const body = await NewFavoriteSchema.parseAsync(req.body);

    const newFavoriteList = new FavoriteList({
      name: body.name,
      description: body.description,
      privacy: body.public ? 'PUBLIC' : 'PRIVATE',
      ownerId: req.user.id,
    });

    await newFavoriteList.save();
    res.sendStatus(200);
  } catch (err) {
    logger.error('Favorite list creation error', err);
    res.sendStatus(400);
  }
});

const UpdateFavoriteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2048).optional(),
  public: z.boolean().optional(),
});
router.put('/:id', authorizeMiddleware(), async (req, res) => {
  try {
    const body = await UpdateFavoriteSchema.parseAsync(req.body);

    await FavoriteList.updateOne(
      {
        _id: req.params.id,
        ownerId: req.user.id,
      },
      {
        name: body.name,
        description: body.description,
        privacy: body.public ? 'PUBLIC' : 'PRIVATE',
      }
    );

    res.sendStatus(200);
  } catch (err) {
    logger.error('Favorite list update error', err);
    res.sendStatus(400);
  }
});

router.delete('/:id', authorizeMiddleware(), async (req, res) => {
  try {
    await FavoriteList.deleteOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });
    res.sendStatus(200);
  } catch (err) {
    logger.log('Favorite list delete error', err);
    res.sendStatus(400);
  }
});

export default router;
