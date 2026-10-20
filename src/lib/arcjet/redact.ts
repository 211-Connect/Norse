import { SocketAddress, isIP } from 'node:net';

import ipaddr from 'ipaddr.js';

import type { ArcjetRequestLike } from './types';

/** Headers that carry client IPs; logged masked (see `maskIp`). */
const IP_HEADERS = new Set([
  'x-forwarded-for',
  'do-connecting-ip',
  'cf-connecting-ip',
  'x-real-ip',
  'x-rdwr-ip',
  'source_ip',
]);

/**
 * The only headers ever logged. An allowlist, so a header added later is
 * excluded by default. Never add `referer` (it carries the search query),
 * `cookie` or `authorization`.
 */
const LOGGED_HEADERS = new Set([
  'host',
  'user-agent',
  'accept',
  'accept-language',
  'via',
  ...IP_HEADERS,
]);

/** The address without a `:port` (`1.2.3.4:5`, `[v6]:5`), or undefined. */
function addressOf(value: string): string | undefined {
  if (isIP(value) !== 0) return value;
  const unbracketed = /^\[([^\]]+)\]$/.exec(value)?.[1];
  if (unbracketed && isIP(unbracketed) !== 0) return unbracketed;
  // SocketAddress.parse also accepts legacy forms (`1.2.3` is read as
  // 1.2.0.3), so keep its result only when that address is what was written.
  const address = SocketAddress.parse(value)?.address;
  const typed = value.toLowerCase();
  return address &&
    (typed.startsWith(`${address}:`) || typed.startsWith(`[${address}]:`))
    ? address
    : undefined;
}

/**
 * Mask an address for logging: IPv4 to its first two octets, IPv6 to its
 * first two groups, IPv4-mapped IPv6 as its IPv4 address. Every address is
 * masked the same way, routable or not. A port is dropped first. Anything
 * that is not an address becomes `x`, so a malformed value never leaks.
 */
export function maskIp(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const address = addressOf(trimmed);
  if (!address) return 'x';
  const ip = ipaddr.process(address);
  if (ip.kind() === 'ipv4') {
    const [a, b] = (ip as ipaddr.IPv4).octets;
    return `${a}.${b}.x.x`;
  }
  const [a, b] = (ip as ipaddr.IPv6).parts;
  return `${a.toString(16)}:${b.toString(16)}:x`;
}

export function maskIpList(value: string): string {
  return value
    .split(',')
    .map((part) => maskIp(part))
    .join(', ');
}

/**
 * Request headers safe to log: only `LOGGED_HEADERS`, with IP-bearing
 * headers masked. Every other header is dropped.
 */
export function redactHeaders(
  headers: ArcjetRequestLike['headers'],
): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, rawName) => {
    const name = rawName.toLowerCase();
    if (!LOGGED_HEADERS.has(name)) return;
    out[name] = IP_HEADERS.has(name) ? maskIpList(value) : value;
  });
  return out;
}

/** Returns true at most `maxPerMinute` times in any wall-clock minute. */
export function createMinuteSampler(
  maxPerMinute: number,
  now: () => number = Date.now,
): () => boolean {
  let windowStart = 0;
  let count = 0;
  return () => {
    const minute = Math.floor(now() / 60_000);
    if (minute !== windowStart) {
      windowStart = minute;
      count = 0;
    }
    count += 1;
    return count <= maxPerMinute;
  };
}
