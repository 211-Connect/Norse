import { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
export function cacheControl(res: Response) {
  if (!isProduction) return;
  res.setHeader('Vary', 'x-tenant-id,x-locale');
  res.setHeader('Cache-Control', 'max-age=3600 public');
}
