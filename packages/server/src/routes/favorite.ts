import { Router } from 'express';
import { FavoriteList } from '../models/FavoriteList';
import { authorizeMiddleware } from '../middleware/authorize';
import z from 'zod';

const router = Router();

const NewFavoriteSchema = z.object({
  resourceId: z.string(),
  favoriteListId: z.string(),
});

router.post('/', authorizeMiddleware(), async (req, res) => {
  try {
    const data = await NewFavoriteSchema.parseAsync(req.body);

    const favoriteList = await FavoriteList.findOne({
      ownerId: req.user.id,
      _id: data.favoriteListId,
    });

    if (!favoriteList)
      throw new Error('No favorite list found to add favorite to.');

    const favorites = favoriteList.favorites;
    const exists = favorites.find((el) => el.toString() === data.resourceId);

    if (exists) {
      // Using 409 Conflict here because the resource already exists in the list
      return res
        .status(409)
        .json({ message: 'Resource already exists in list' });
    }

    if (!exists) {
      favoriteList.favorites.push(data.resourceId);
    }

    const newList = await favoriteList.save();
    res.json(newList);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

router.delete(
  '/:favoriteId/:favoriteListId',
  authorizeMiddleware(),
  async (req, res) => {
    try {
      const favoriteList = await FavoriteList.findOne({
        ownerId: req.user.id,
        _id: req.params.favoriteListId,
      });

      if (!favoriteList)
        throw new Error('No favorite list found to remove favorite from.');

      const favorites = favoriteList.favorites;
      const index = favorites.findIndex(
        (el) => el.toString() === req.params.favoriteId
      );

      if (index > -1) {
        favoriteList.favorites.splice(index, 1);
      }

      const newList = await favoriteList.save();
      res.json(newList);
    } catch (err) {
      console.log(err);
      res.sendStatus(400);
    }
  }
);

export default router;
