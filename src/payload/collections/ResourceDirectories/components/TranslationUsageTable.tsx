'use client';

import { useAuth, useFormFields } from '@payloadcms/ui';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  charactersToUsd,
  getUsageMonth,
  resolveTranslationUsageLimits,
  usdToCharacters,
} from '@/app/(app)/shared/services/translation-usage/translation-usage-limits';
import type {
  TranslationUsage,
  TranslationUsageAlert,
} from '@/payload/payload-types';

import './TranslationUsageTable.css';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      rows: TranslationUsage[];
      alert: TranslationUsageAlert | null;
    };

const LIMIT_PATH = 'printableDirectories.translation';
const MONTHS_SHOWN = 12;

const formatUsd = (usd: number) => `$${usd.toFixed(2)}`;
const formatNumber = (value: number) => value.toLocaleString('en-US');

function getRecentMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) =>
    getUsageMonth(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)),
    ),
  );
}

function buildQuery(tenantId: string, month: string, extra = ''): string {
  return (
    `where[tenantId][equals]=${encodeURIComponent(tenantId)}` +
    `&where[month][equals]=${encodeURIComponent(month)}` +
    `&depth=0${extra}`
  );
}

async function fetchDocs<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  const body = (await response.json()) as { docs: T[] };
  return body.docs;
}

/**
 * Per-user machine-translation usage for this tenant, by month. Super-admins
 * and support only (the collections' read access enforces it as well). See
 * docs/translation-usage.md.
 */
const TranslationUsageTable = () => {
  const { user } = useAuth();
  const canView = Boolean(
    user?.roles?.includes('super-admin') || user?.roles?.includes('support'),
  );

  const tenantValue = useFormFields(([fields]) => fields.tenant?.value);
  const alertThresholdUsd = useFormFields(
    ([fields]) => fields[`${LIMIT_PATH}.alertThresholdUsd`]?.value,
  );
  const userQuotaUsd = useFormFields(
    ([fields]) => fields[`${LIMIT_PATH}.userQuotaUsd`]?.value,
  );
  const tenantCapUsd = useFormFields(
    ([fields]) => fields[`${LIMIT_PATH}.tenantCapUsd`]?.value,
  );

  const tenantId =
    tenantValue && typeof tenantValue === 'object' && 'id' in tenantValue
      ? String((tenantValue as { id: unknown }).id)
      : tenantValue
        ? String(tenantValue)
        : null;

  const limits = resolveTranslationUsageLimits({
    alertThresholdUsd: alertThresholdUsd as number | null | undefined,
    userQuotaUsd: userQuotaUsd as number | null | undefined,
    tenantCapUsd: tenantCapUsd as number | null | undefined,
  });

  const months = useMemo(() => getRecentMonths(MONTHS_SHOWN), []);
  const [month, setMonth] = useState(months[0]);
  const [state, setState] = useState<State>({ status: 'loading' });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!canView || !tenantId) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setState({ status: 'loading' });

    Promise.all([
      fetchDocs<TranslationUsage>(
        `/api/translation-usage?${buildQuery(tenantId, month, '&sort=-billedCharacters&limit=0&pagination=false')}`,
      ),
      fetchDocs<TranslationUsageAlert>(
        `/api/translation-usage-alerts?${buildQuery(tenantId, month, '&limit=1')}`,
      ),
    ])
      .then(([rows, alerts]) => {
        if (requestIdRef.current === requestId) {
          setState({ status: 'ready', rows, alert: alerts[0] ?? null });
        }
      })
      .catch((error: unknown) => {
        if (requestIdRef.current === requestId) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
  }, [canView, tenantId, month]);

  if (!canView) {
    return null;
  }

  const toUsd = (characters: number) =>
    charactersToUsd(characters, limits.pricePerMillionCharacters);
  const userQuotaCharacters = usdToCharacters(
    limits.userQuotaUsd,
    limits.pricePerMillionCharacters,
  );

  const tenantCharacters =
    state.status === 'ready'
      ? state.rows.reduce((sum, row) => sum + row.billedCharacters, 0)
      : 0;
  const tenantUsd = toUsd(tenantCharacters);
  const capRatio =
    limits.tenantCapUsd > 0 ? Math.min(1, tenantUsd / limits.tenantCapUsd) : 1;
  const alertRatio =
    limits.tenantCapUsd > 0
      ? Math.min(1, limits.alertThresholdUsd / limits.tenantCapUsd)
      : 0;

  return (
    <div className="translation-usage">
      <div className="translation-usage__header">
        <h3 className="translation-usage__title">Translation usage</h3>
        <select
          className="translation-usage__month"
          aria-label="Month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        >
          {months.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <p className="translation-usage__description">
        Automatic translation in printable directories, per user (UTC months).
        Cost is an estimate at {formatUsd(limits.pricePerMillionCharacters)} per
        million billed characters; cached translations are free. Only
        super-admins and support can see this.
      </p>

      {!tenantId && (
        <p className="translation-usage__muted">Save the directory first.</p>
      )}
      {tenantId && state.status === 'loading' && (
        <p className="translation-usage__muted">Loading…</p>
      )}
      {tenantId && state.status === 'error' && (
        <p className="translation-usage__error">
          Could not load usage: {state.message}
        </p>
      )}
      {tenantId && state.status === 'ready' && (
        <>
          <div className="translation-usage__summary">
            <div>
              <strong>{formatUsd(tenantUsd)}</strong> of{' '}
              {formatUsd(limits.tenantCapUsd)} tenant cap (
              {formatNumber(tenantCharacters)} characters)
            </div>
            <div
              className="translation-usage__meter"
              role="meter"
              aria-label="Tenant monthly cost against hard cap"
              aria-valuemin={0}
              aria-valuemax={limits.tenantCapUsd}
              aria-valuenow={Number(tenantUsd.toFixed(2))}
            >
              <div
                className={`translation-usage__meter-fill${capRatio >= 1 ? ' translation-usage__meter-fill--full' : ''}`}
                style={{ width: `${capRatio * 100}%` }}
              />
              <div
                className="translation-usage__meter-alert"
                style={{ left: `${alertRatio * 100}%` }}
                title={`Alert threshold ${formatUsd(limits.alertThresholdUsd)}`}
              />
            </div>
            <div className="translation-usage__muted">
              Alert at {formatUsd(limits.alertThresholdUsd)}
              {state.alert
                ? ` — sent ${new Date(state.alert.createdAt).toLocaleString()}`
                : ''}
              . Per-user quota {formatUsd(limits.userQuotaUsd)}.
            </div>
          </div>

          {state.rows.length === 0 ? (
            <p className="translation-usage__muted">
              No automatic translation this month.
            </p>
          ) : (
            <div className="translation-usage__table-wrapper">
              <table className="translation-usage__table">
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col" className="is-numeric">
                      Est. cost
                    </th>
                    <th scope="col" className="is-numeric">
                      Billed chars
                    </th>
                    <th scope="col" className="is-numeric">
                      Requested chars
                    </th>
                    <th scope="col" className="is-numeric">
                      Saves
                    </th>
                    <th scope="col" className="is-numeric">
                      Largest field
                    </th>
                    <th scope="col">Languages</th>
                    <th scope="col">Last used</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.userEmail}
                        {row.billedCharacters >= userQuotaCharacters && (
                          <span className="translation-usage__badge">
                            Quota reached
                          </span>
                        )}
                      </td>
                      <td className="is-numeric">
                        {formatUsd(toUsd(row.billedCharacters))}
                      </td>
                      <td className="is-numeric">
                        {formatNumber(row.billedCharacters)}
                      </td>
                      <td className="is-numeric">
                        {formatNumber(row.requestedCharacters)}
                      </td>
                      <td className="is-numeric">
                        {formatNumber(row.translationRuns)}
                      </td>
                      <td className="is-numeric">
                        {formatNumber(row.largestFieldCharacters)}
                      </td>
                      <td>
                        {Array.isArray(row.locales)
                          ? row.locales.join(', ')
                          : ''}
                      </td>
                      <td>{new Date(row.lastUsedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TranslationUsageTable;
