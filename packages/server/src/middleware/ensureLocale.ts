import { RequestHandler } from 'express';

// Ensure that a locale exists on the request. If one does not exist, we should
// set it to a default locale.
export function ensureLocale(defaultLocale: string): RequestHandler {
  return function (req, res, next) {
    if (!req.headers['x-locale']) {
      req.headers['x-locale'] = defaultLocale;
    }
    next();
  };
}
