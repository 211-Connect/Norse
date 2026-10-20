import { isIP } from 'node:net';

import { parseProxies, resolveClientIp } from '@arcjet/ip';
import { cloudflare } from '@arcjet/next';

import { hostOf } from './enforcement';
import type { ArcjetRequestLike } from './types';

export const MBOA_PROXY_IP = '13.86.38.95' as const;

/** Passed to the SDK, and used here, so both resolve the same client IP. */
export const ARCJET_PROXIES = [cloudflare(), MBOA_PROXY_IP];
const PARSED_PROXIES = parseProxies(ARCJET_PROXIES);

/**
 * The only host where a request with no routable client IP gets special
 * handling, and only when it arrived through the mn.gov proxy (ISS-1734):
 * see `internalIpSrc`. Anywhere else, missing or untrusted forwarding
 * headers go to Arcjet unchanged.
 */
export const NO_CLIENT_IP_BYPASS_HOST = 'mboa.c211.io' as const;

/**
 * The hop the mn.gov proxy appended to `x-forwarded-for`: the entry
 * immediately left of the last `MBOA_PROXY_IP`. That proxy wrote it, so it
 * is trusted even though it is a private (State network) address; entries
 * further left were written by hops we do not control. Returns undefined
 * when the proxy is absent or that entry is not an IP. Pattern advised by
 * Arcjet support (2026-10-19).
 */
export function internalIpSrc(forwardedFor: string | null): string | undefined {
  const hops = (forwardedFor ?? '').split(',').map((hop) => hop.trim());
  const proxyAt = hops.lastIndexOf(MBOA_PROXY_IP);
  const peer = proxyAt > 0 ? hops[proxyAt - 1] : undefined;
  return peer && isIP(peer) !== 0 ? peer : undefined;
}

/**
 * The client IP Arcjet resolves for this request (same proxy list), or ''
 * when no globally routable address is left after trusted proxies and
 * private/CGNAT/ULA hops are skipped. Used for decisions only; never logged.
 */
export function resolveArcjetClientIp(request: ArcjetRequestLike): string {
  try {
    const { ip } = resolveClientIp(
      { headers: request.headers as Headers },
      { proxies: PARSED_PROXIES },
    );
    return ip;
  } catch {
    return '';
  }
}

/** MBOA traffic through the mn.gov proxy with no routable client IP. */
export function isMboaWithoutClientIp(request: ArcjetRequestLike): boolean {
  return (
    hostOf(request) === NO_CLIENT_IP_BYPASS_HOST &&
    request.headers.get('do-connecting-ip')?.trim() === MBOA_PROXY_IP &&
    resolveArcjetClientIp(request) === ''
  );
}
