import type { ArcjetRequestLike } from './types';

/** Host-list value that matches every host. */
export const ALL_HOSTS = '*' as const;

/**
 * A host for matching: lower-cased, port and a trailing dot removed, IPv6
 * literals kept in brackets (`[::1]`). '' when the value is not a host.
 */
export function normalizeHost(value: string): string {
  const host = value.trim().toLowerCase();
  if (!host) return '';
  try {
    return new URL(`http://${host}`).hostname.replace(/\.$/, '');
  } catch {
    return '';
  }
}

/**
 * Parse a comma-separated host list (normalized as `normalizeHost`, blanks
 * and unparseable entries dropped). `*` is kept as `ALL_HOSTS`.
 */
export function parseHostList(value: string | undefined): ReadonlySet<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((h) => (h.trim() === ALL_HOSTS ? ALL_HOSTS : normalizeHost(h)))
      .filter(Boolean),
  );
}

export function hostOf(request: ArcjetRequestLike): string {
  return normalizeHost(request.headers.get('host') ?? '');
}

export interface ArcjetEnforcement {
  /** Hosts where a DENY is enforced, or `*` for all. */
  enforced: ReadonlySet<string>;
  /** Hosts never enforced. Wins over `enforced`; `*` = nothing enforced. */
  unenforced: ReadonlySet<string>;
}

/**
 * Where a DENY is enforced (403). Everywhere else Arcjet still runs and
 * logs `arcjet_denied` with `enforced: false`, but the request is served.
 * Read from env at startup, so rollout and rollback are env changes. This is
 * deliberately not a per-tenant Payload setting: every tenant gets the same
 * protection. See docs/bot-protection.md.
 *
 * - `ARCJET_ENFORCED_HOSTS`: comma list, or `*` for every host. Unset or
 *   empty = log-only everywhere (the kill switch).
 * - `ARCJET_UNENFORCED_HOSTS`: comma list of hosts left out, even under
 *   `*`. A host in both lists is not enforced.
 */
export const ARCJET_ENFORCEMENT: ArcjetEnforcement = {
  enforced: parseHostList(process.env.ARCJET_ENFORCED_HOSTS),
  unenforced: parseHostList(process.env.ARCJET_UNENFORCED_HOSTS),
};

/** Matches on the `host` header only (see `normalizeHost`). */
export function isEnforcedHost(
  request: ArcjetRequestLike,
  enforcement: ArcjetEnforcement = ARCJET_ENFORCEMENT,
): boolean {
  const host = hostOf(request);
  const listed = (hosts: ReadonlySet<string>) =>
    hosts.has(ALL_HOSTS) || (host !== '' && hosts.has(host));
  return listed(enforcement.enforced) && !listed(enforcement.unenforced);
}
