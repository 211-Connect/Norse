'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import './LandingTopicFields.css';

/**
 * Shown while a slug that live pages already use is being edited: their
 * addresses move, the old ones answer 308 (docs/landing-pages.md).
 */
const LandingTopicSlugWarning = () => {
  const { id } = useDocumentInfo();
  const slug = useFormFields(([fields]) => fields.slug);
  const [livePages, setLivePages] = useState(0);

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

  const changed =
    Boolean(slug?.initialValue) && slug?.value !== slug?.initialValue;
  if (!changed || livePages === 0) return null;

  return (
    <p className="landing-topic-note landing-topic-note--warn">
      This URL is in Google; changing it moves its ranking to the new URL, with
      a short dip. The old address of each of the {livePages} pages keeps
      working with a 308 redirect after Apply changes.
    </p>
  );
};

export default LandingTopicSlugWarning;
