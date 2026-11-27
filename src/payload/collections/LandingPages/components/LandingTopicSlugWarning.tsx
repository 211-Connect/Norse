'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import './LandingTopicFields.css';
import { useLandingCopyContext } from './useLandingCopyContext';

/** `/food/tacoma-wa` or `/es/comida/tacoma-wa` → the topic segment. */
const topicSegment = (path: string | null | undefined) => {
  const parts = (path ?? '').split('/').filter(Boolean);
  return parts.length >= 3 ? parts[1] : (parts[0] ?? null);
};

/**
 * Below the slug (docs/landing-pages.md, Topics): while a slug that live
 * pages use is being edited, that their URLs move and the old ones answer
 * 308; once a new slug is saved, that the pages keep their old URL until
 * Apply changes.
 */
const LandingTopicSlugWarning = () => {
  const { id } = useDocumentInfo();
  const slug = useFormFields(([fields]) => fields.slug);
  const [livePages, setLivePages] = useState(0);
  // A live page's current URL in this locale: what the pages use today.
  const pagesSlug = topicSegment(useLandingCopyContext('topic')?.path);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(
      `/api/landing-pages?where[topic][equals]=${id}&where[status][equals]=live&limit=1&depth=0`,
      { credentials: 'include' },
    )
      .then((response) => (response.ok ? response.json() : { totalDocs: 0 }))
      .then((body: { totalDocs?: number }) => {
        if (!cancelled) setLivePages(body.totalDocs ?? 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (livePages === 0) return null;
  const saved = slug?.initialValue as string | undefined;
  const editing = Boolean(saved) && slug?.value !== saved;

  if (editing) {
    return (
      <p className="landing-topic-note landing-topic-note--warn">
        This URL is in Google; changing it moves its ranking to the new URL,
        with a short dip.{' '}
        {livePages === 1
          ? 'The old URL of its live page keeps'
          : `The old URLs of its ${livePages} live pages keep`}{' '}
        working with a 308 redirect after Apply changes.
      </p>
    );
  }

  // Saved, not applied yet: the new URL is not live, the old one still is.
  if (saved && pagesSlug && pagesSlug !== saved) {
    return (
      <p className="landing-topic-note landing-topic-note--warn">
        The pages still use <code>/{pagesSlug}/…</code>. Click Apply changes on
        the Resource Directory&apos;s Landing Pages tab to move them to{' '}
        <code>/{saved}/…</code>; until then the new URLs answer 404, and
        afterwards the old ones redirect.
      </p>
    );
  }
  return null;
};

export default LandingTopicSlugWarning;
