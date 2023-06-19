import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant';
import resource from './resource';
import search from './search';
import taxonomy from './taxonomy';
import favoriteList from './favorite-list';
import favorite from './favorite';
import urlShortener from './short-url';

const router = Router();

router.use('/resource', tenantMiddleware(), resource);
router.use('/favorite', tenantMiddleware(), favorite);
router.use('/favorite-list', tenantMiddleware(), favoriteList);
router.use('/search', tenantMiddleware(), search);
router.use('/taxonomy', tenantMiddleware(), taxonomy);
router.use('/short-url', tenantMiddleware(), urlShortener);

export default router;
