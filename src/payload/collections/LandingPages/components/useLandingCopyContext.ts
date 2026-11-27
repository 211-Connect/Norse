'use client';

import { useDocumentInfo, useFormFields, useLocale } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import type {
  CopyLayers,
  CopyTagValues,
} from '@/app/(app)/features/landing-pages/lib/copy';

import type { CopyScope } from '../copyFields';

export type CopyContext = {
  layers: CopyLayers;
  values: CopyTagValues;
  host: string | null;
  path: string | null;
};

// One request per document and locale, shared by the fields and preview.
const cache = new Map<string, Promise<CopyContext | null>>();

const load = (url: string) => {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
    cache.set(url, pending);
    // Saved edits change what is inherited; refetch after a while.
    setTimeout(() => cache.delete(url), 30_000);
  }
  return pending;
};

const useTenantId = () => {
  const value = useFormFields(([fields]) => fields.tenant?.value);
  if (value && typeof value === 'object' && 'id' in value) {
    return String((value as { id: unknown }).id);
  }
  return value ? String(value) : null;
};

/** The inherited copy layers and sample values for the open document. */
export function useLandingCopyContext(scope: CopyScope) {
  const tenantId = useTenantId();
  const { code: locale } = useLocale();
  const { id } = useDocumentInfo();
  const [context, setContext] = useState<CopyContext | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const params = new URLSearchParams({ tenantId, locale });
    if (scope === 'topic' && id) params.set('topicId', String(id));
    let cancelled = false;
    void load(`/api/landing-pages/admin/copy-context?${params}`).then(
      (value) => !cancelled && setContext(value),
    );
    return () => {
      cancelled = true;
    };
  }, [tenantId, locale, id, scope]);

  return context;
}

/** The group path a copy field or preview belongs to. */
export const groupPath = (path: string) =>
  path.includes('.') ? path.slice(0, path.lastIndexOf('.')) : '';
