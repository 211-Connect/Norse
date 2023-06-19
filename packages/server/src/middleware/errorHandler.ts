import { NextFunction, Response, Request } from 'express';
import { logger } from '../lib/winston';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  logger.error('Unhandled error:', err);
  res.sendStatus(500);
}
