import { createHmac } from 'node:crypto';

import type { DecisionRecord } from '@/lib/telemetry/arcjet-decision-log';

import { resolveArcjetClientIp } from './client-ip';
import type { RequestFeatures } from './features';
import type { ArcjetProtectResult } from './index';
import { maskNet } from './redact';
import {
  type ArcjetRequestContext,
  type ArcjetRoute,
  localeOfPath,
} from './request';
import type { ArcjetRequestLike } from './types';

/**
 * Builds the flat `arcjet_decision` record and the `arcjet.protect` span
 * attributes from one decision. Pure apart from the optional IP hash, so the
 * page path and the print action share it. Field list: docs/observability.md.
 */

export interface DecisionRecordInput {
  result: ArcjetProtectResult;
  enforced: boolean;
  route: ArcjetRoute;
  tenantId: string;
  context: ArcjetRequestContext;
  features: RequestFeatures;
  /** The request sent to Arcjet (client headers, for the client IP). */
  request: ArcjetRequestLike;
  burst: boolean;
  sampledOutSinceLast?: number;
  /** Print only. */
  idsRequested?: number;
  idsUnique?: number;
  /** Test seam: `ARCJET_LOG_IP_HASH_KEY` and the clock. */
  ipHashKey?: string;
  now?: Date;
}

/**
 * Optional `client_ip_hash` (needs privacy sign-off): HMAC-SHA256 of the
 * client IP with `ARCJET_LOG_IP_HASH_KEY` and the UTC date, so the hash
 * rotates daily and cannot be joined across days. First 12 hex characters.
 * Off unless the key is set.
 */
export function clientIpHash(
  ip: string,
  key: string | undefined,
  now: Date = new Date(),
): string | undefined {
  if (!key || !ip) return undefined;
  const day = now.toISOString().slice(0, 10);
  return createHmac('sha256', `${key}:${day}`)
    .update(ip)
    .digest('hex')
    .slice(0, 12);
}

export function buildDecisionRecord(
  input: DecisionRecordInput,
): DecisionRecord {
  const { result, context, features } = input;
  const deniedBots =
    result.conclusion === 'DENY' || result.conclusion === 'DENIED_NOT_ENFORCED'
      ? result.deniedBots
      : undefined;
  const ip = resolveArcjetClientIp(input.request);
  const ipHash = clientIpHash(
    ip,
    input.ipHashKey ?? process.env.ARCJET_LOG_IP_HASH_KEY,
    input.now,
  );

  return {
    // Decision
    decision_id: result.decisionId,
    conclusion: result.conclusion,
    enforced: input.enforced,
    reason_type: result.reasonType ?? 'none',
    denied_bots: deniedBots,
    allowed_bots: result.allowedBots,
    bot_verified: result.botVerified,
    bot_spoofed: result.botSpoofed,
    ttl: result.ttl,
    dry_run_matches: result.dryRunMatches?.length
      ? JSON.stringify(result.dryRunMatches)
      : undefined,
    error_type: result.errorType,
    error_message: result.errorMessage,
    duration_ms: result.timing?.durationMs,
    event_loop_utilization: result.timing?.eventLoopUtilization,
    burst: input.burst,
    sampled_out_since_last: input.sampledOutSinceLast,
    // Request
    host: context.host,
    tenant_id: input.tenantId || undefined,
    route: input.route,
    method: context.method,
    url_path: context.path,
    locale: localeOfPath(context.path) || undefined,
    query_keys: context.queryKeys.join(','),
    ids_requested: input.idsRequested,
    ids_unique: input.idsUnique,
    // Headers, referer shape, request kind
    ...features.fields,
    // Client state
    client_returning: context.clientReturning,
    aj_signals_present: context.ajSignalsPresent,
    // Network: never the full IP.
    client_net: ip ? maskNet(ip) : undefined,
    client_ip_hash: ipHash,
    // Fingerprint
    client_signature: features.signature,
    checks: features.checks.join(',') || undefined,
  };
}

/** The keys used by the dry-run log cap: one per (route, rule). */
export function dryRunKeysOf(
  result: ArcjetProtectResult,
  route: string,
): string[] {
  return (result.dryRunMatches ?? []).map(
    (m) => `${route}:${m.ruleType}:${m.ruleId}`,
  );
}

/** Attributes added to the `arcjet.protect` span (low-cardinality, no PII). */
export function decisionSpanAttributes(
  input: Pick<
    DecisionRecordInput,
    'result' | 'route' | 'tenantId' | 'context' | 'features' | 'burst'
  >,
): Record<string, string | number | boolean> {
  const { result, context, features } = input;
  const attrs: Record<string, string | number | boolean> = {
    'arcjet.host': context.host,
    'arcjet.route': input.route,
    'arcjet.method': context.method,
    'arcjet.reason_type': result.reasonType ?? 'none',
    'arcjet.client.signature': features.signature,
    'arcjet.aj_signals_present': context.ajSignalsPresent,
    'arcjet.burst': input.burst,
    'arcjet.ref_path_empty': features.refPathEmpty,
    'arcjet.checks': features.checks.join(','),
  };
  if (input.tenantId) attrs['arcjet.tenant_id'] = input.tenantId;
  if (context.clientReturning !== undefined) {
    attrs['arcjet.client.returning'] = context.clientReturning;
  }
  if (result.ttl !== undefined) attrs['arcjet.ttl'] = result.ttl;
  if (
    result.conclusion === 'DENY' ||
    result.conclusion === 'DENIED_NOT_ENFORCED'
  ) {
    attrs['arcjet.denied_bots'] = result.deniedBots.join(',');
  }
  return attrs;
}
