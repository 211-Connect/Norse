'use client';

import { Button, useFormFields, useFormModified } from '@payloadcms/ui';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import './LandingSummaryCard.css';

type Summary = {
  creates: number;
  retires: number;
  revives: number;
  unchanged: number;
  addressChanges: number;
  redirectsUpdated: number;
  conflicts: number;
};

type Status = {
  livePages: number;
  locales: number;
  lastGeneratedAt: string | null;
  lastCountedAt: string | null;
  generation: {
    state: 'never' | 'queued' | 'running' | 'done' | 'failed';
    completedAt?: string | null;
    summary?: Summary | null;
    error?: string | null;
  };
};

type Preview = { summary: Summary; conflicts: string[] };

const when = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : 'never';

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

const useTenantId = () => {
  const value = useFormFields(([fields]) => fields.tenant?.value);
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return value ? String(value) : null;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/landing-pages/admin/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? `HTTP ${response.status}`);
  return body as T;
}

/**
 * Top of the Landing Pages tab: what is live, and Apply changes, which
 * previews the diff of the saved settings and then queues the generation
 * job (docs/landing-pages.md, "Generating pages").
 */
const LandingSummaryCard = () => {
  const tenantId = useTenantId();
  const modified = useFormModified();
  const [status, setStatus] = useState<Status | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    try {
      setStatus(
        await call<Status>(`summary?tenantId=${encodeURIComponent(tenantId)}`),
      );
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [tenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const working =
    status?.generation.state === 'queued' ||
    status?.generation.state === 'running';
  // A failed refresh (signed out, server down) stops polling; the error shows.
  const polling = working && !error;
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => void refresh(), 3000);
    return () => clearInterval(timer);
  }, [polling, refresh]);

  if (!tenantId) return null;

  const run = async (step: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await step();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const showPreview = () =>
    run(async () => {
      setPreview(
        await call<Preview>('preview', {
          method: 'POST',
          body: JSON.stringify({ tenantId }),
        }),
      );
    });

  const apply = () =>
    run(async () => {
      await call('apply', {
        method: 'POST',
        body: JSON.stringify({ tenantId }),
      });
      setPreview(null);
      await refresh();
    });

  const nothingToDo =
    preview &&
    preview.summary.creates +
      preview.summary.retires +
      preview.summary.revives +
      preview.summary.addressChanges +
      preview.summary.redirectsUpdated ===
      0;
  const last = status?.generation;

  return (
    <section className="landing-summary">
      <div className="landing-summary__stats">
        <div>
          <strong>{status ? status.livePages.toLocaleString() : '…'}</strong>
          <span>live pages</span>
        </div>
        <div>
          <strong>{status ? status.locales : '…'}</strong>
          <span>languages each</span>
        </div>
        <div>
          <strong>{status ? when(status.lastGeneratedAt) : '…'}</strong>
          <span>last generated</span>
        </div>
        <div>
          <strong>{status ? when(status.lastCountedAt) : '…'}</strong>
          <span>result counts updated</span>
        </div>
        <Link
          className="landing-summary__link"
          href="/admin/collections/landing-pages"
        >
          View all pages
        </Link>
      </div>

      {working && (
        <p className="landing-summary__note">
          Generating pages… this can take a few minutes for a whole state.
        </p>
      )}
      {last?.state === 'failed' && (
        <p className="landing-summary__note landing-summary__note--error">
          The last run failed. Nothing was changed. {last.error}
        </p>
      )}
      {error && (
        <p className="landing-summary__note landing-summary__note--error">
          {error}
        </p>
      )}

      {preview ? (
        <div className="landing-summary__preview">
          {nothingToDo ? (
            <p>Pages already match the saved settings.</p>
          ) : (
            <ul>
              {preview.summary.creates > 0 && (
                <li>{plural(preview.summary.creates, 'new page')}</li>
              )}
              {preview.summary.revives > 0 && (
                <li>{plural(preview.summary.revives, 'page')} back live</li>
              )}
              {preview.summary.retires > 0 && (
                <li>
                  {plural(preview.summary.retires, 'page')} retired, redirecting
                  to the nearest live page
                </li>
              )}
              {preview.summary.addressChanges > 0 && (
                <li>
                  {plural(
                    preview.summary.addressChanges,
                    'address',
                    'addresses',
                  )}{' '}
                  changed; old ones redirect
                </li>
              )}
              {preview.summary.redirectsUpdated > 0 && (
                <li>
                  {plural(preview.summary.redirectsUpdated, 'redirect')} updated
                </li>
              )}
            </ul>
          )}
          {preview.summary.conflicts > 0 && (
            <details className="landing-summary__conflicts">
              <summary>
                {plural(preview.summary.conflicts, 'address', 'addresses')}{' '}
                skipped: already used by another page
              </summary>
              <ul>
                {preview.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="landing-summary__actions">
            {!nothingToDo && (
              <Button size="small" disabled={busy} onClick={apply}>
                Apply
              </Button>
            )}
            <Button
              size="small"
              buttonStyle="secondary"
              disabled={busy}
              onClick={() => setPreview(null)}
            >
              {nothingToDo ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="landing-summary__actions">
          <Button
            size="small"
            disabled={busy || working || modified}
            onClick={showPreview}
          >
            Apply changes…
          </Button>
          <span className="landing-summary__hint">
            {modified
              ? 'Save first: Apply changes uses the saved settings.'
              : 'Saving never changes pages; Apply changes does.'}
          </span>
        </div>
      )}
    </section>
  );
};

export default LandingSummaryCard;
