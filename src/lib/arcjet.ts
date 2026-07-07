import arcjet, { detectBot, request, shield } from '@arcjet/next';

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

export async function arcjetProtectPage(): Promise<void> {
  const req = await request();

  const decision = await aj.protect(req);

  console.log(JSON.stringify(decision));
  if (decision.isDenied()) {
    log.warn({
      event: 'arcjet_denied',
      decision: JSON.stringify(decision),
    });
  }
}
