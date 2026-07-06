import arcjet, { detectBot, request, shield } from '@arcjet/next';
import { notFound } from 'next/navigation';

import { createLogger } from '@/lib/logger';
const log = createLogger('arcjet');

type ArcjetHeader = Record<string, string | string[] | undefined> | Headers;

const CLOUD_FLARE_IP_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  proxies: [...CLOUD_FLARE_IP_RANGES],
  rules: [
    shield({
      mode: 'LIVE',
    }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
  ],
});

/**
 * Protect a server-rendered page with Arcjet. If the request is denied,
 * logs a structured warning and returns a 404 via next/navigation's notFound().
 */
function getRequestHeader(
  headers: ArcjetHeader,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    return headers.get(name) ?? undefined;
  }
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export async function arcjetProtectPage(pathname?: string): Promise<void> {
  const req = await request();

  const host =
    getRequestHeader(req.headers as ArcjetHeader, 'x-forwarded-host') ??
    getRequestHeader(req.headers as ArcjetHeader, 'host') ??
    'localhost';
  const proto =
    getRequestHeader(req.headers as ArcjetHeader, 'x-forwarded-proto') ??
    'https';

  const url = pathname ? `${proto}://${host}${pathname}` : `${proto}://${host}`;

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    const reason = decision.reason.isBot()
      ? 'bot'
      : decision.reason.isShield()
        ? 'shield'
        : 'unknown';

    log.warn(
      {
        event: 'arcjet_denied',
        path: url,
        reason,
        ip:
          getRequestHeader(req.headers as ArcjetHeader, 'x-forwarded-for') ??
          getRequestHeader(req.headers as ArcjetHeader, 'x-real-ip') ??
          'unknown',
      },
      'Arcjet denied request',
    );

    notFound();
  }
}
