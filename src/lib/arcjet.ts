import arcjet, { cloudflare, detectBot, request } from '@arcjet/next';

import { createLogger } from '@/lib/logger';

const log = createLogger('arcjet');

const HEADER_DO_CONNECTING_IP = 'do-connecting-ip' as const;

const MBOA_PROXY_IP = '13.86.38.95' as const;
type ArcjetHeaders =
  Record<string, string | string[] | undefined> | Headers | undefined;

function getHeader(headers: ArcjetHeaders, name: string) {
  if (!headers) return 'unknown';
  if (headers instanceof Headers) {
    return headers.get(name) ?? 'unknown';
  }
  const value = headers[name];
  if (Array.isArray(value)) return value.join(', ');
  return value ?? 'unknown';
}

const arcjetKey = process.env.ARCJET_KEY;

const aj = arcjetKey
  ? arcjet({
      key: arcjetKey,
      proxies: [cloudflare(), MBOA_PROXY_IP],
      rules: [
        detectBot({
          mode: 'LIVE',
          allow: ['CATEGORY:SEARCH_ENGINE'],
        }),
      ],
    })
  : undefined;

export async function arcjetProtectPage(
  pathName: string,
  tenantId: string,
): Promise<void> {
  if (!aj) return;

  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    log.warn({
      event: 'arcjet_denied',
      reason: decision.reason,
      ip: getHeader(req.headers, HEADER_DO_CONNECTING_IP),
      tenantId,
      pathName,
    });
  }
}
