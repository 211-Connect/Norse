'use client';

import { Button, useForm, useFormFields } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import {
  type DirectorySources,
  type SourceStatus,
  listTopicSources,
  sourceStatus,
} from '@/app/(app)/features/landing-pages/lib/topicSources';

import './LandingTopicFields.css';

const value = (fields: Record<string, { value?: unknown }>, path: string) =>
  fields[path]?.value as string | null | undefined;

/**
 * Compares the topic's copied search with its source on the Resource
 * Directory and warns when the source changed or is gone. Nothing changes
 * by itself; "Re-copy from source" updates the form, to be saved.
 */
const LandingTopicSourceField = () => {
  const { dispatchFields, setModified } = useForm();
  const form = useFormFields(([fields]) => ({
    tenant: fields.tenant?.value,
    kind: value(fields, 'source.kind'),
    ref: value(fields, 'source.ref'),
    label: value(fields, 'source.label'),
    queryType: value(fields, 'search.queryType'),
    query: value(fields, 'search.query'),
  }));
  const tenantId =
    form.tenant && typeof form.tenant === 'object' && 'id' in form.tenant
      ? String((form.tenant as { id: unknown }).id)
      : form.tenant
        ? String(form.tenant)
        : null;

  const [directory, setDirectory] = useState<DirectorySources | null>(null);
  useEffect(() => {
    if (!tenantId || !form.kind || form.kind === 'custom') return;
    let cancelled = false;
    fetch(
      `/api/resource-directories?where[tenant][equals]=${encodeURIComponent(tenantId)}&limit=1&depth=0&locale=en`,
      { credentials: 'include' },
    )
      .then((response) => (response.ok ? response.json() : { docs: [] }))
      .then((body: { docs: DirectorySources[] }) => {
        if (!cancelled) setDirectory(body.docs[0] ?? {});
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantId, form.kind]);

  if (!form.kind || form.kind === 'custom' || !directory) return null;

  const status: SourceStatus = sourceStatus(
    {
      source: {
        kind: form.kind as 'subtopic',
        ref: form.ref,
        label: form.label,
      },
      search: { queryType: form.queryType, query: form.query },
    },
    listTopicSources(directory),
  );
  const noun = form.kind === 'subtopic' ? 'topic-card subtopic' : 'suggestion';

  if (status.state === 'missing') {
    return (
      <p className="landing-topic-note landing-topic-note--warn">
        The {noun} this search was copied from no longer exists or has no
        search. Pages keep working with the copy below.
      </p>
    );
  }
  if (status.state !== 'changed') return null;

  const recopy = () => {
    const { source } = status;
    dispatchFields({
      type: 'UPDATE',
      path: 'search.queryType',
      value: source.search!.queryType,
    });
    dispatchFields({
      type: 'UPDATE',
      path: 'search.query',
      value: source.search!.query,
    });
    dispatchFields({
      type: 'UPDATE',
      path: 'source.label',
      value: source.label,
    });
    setModified(true);
  };

  return (
    <div className="landing-topic-note landing-topic-note--warn">
      <p>
        The {noun} &ldquo;{status.source.label}&rdquo; changed since its{' '}
        {status.what.join(' and ')} was copied
        {status.what.includes('search') &&
          ` (now: ${status.source.search!.queryType === 'taxonomy' ? 'codes' : 'text'} “${status.source.search!.query}”)`}
        . The pages still use the copy below.
      </p>
      <Button buttonStyle="secondary" size="small" onClick={recopy}>
        Re-copy from source
      </Button>
    </div>
  );
};

export default LandingTopicSourceField;
