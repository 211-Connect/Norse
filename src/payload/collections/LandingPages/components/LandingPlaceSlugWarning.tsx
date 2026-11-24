'use client';

import { useFormFields } from '@payloadcms/ui';

import './LandingTopicFields.css';

/** Shown while a live page's place slug is being edited. */
const LandingPlaceSlugWarning = () => {
  const slug = useFormFields(([fields]) => fields.placeSlug);
  const status = useFormFields(([fields]) => fields.status?.value);
  const changed =
    Boolean(slug?.initialValue) && slug?.value !== slug?.initialValue;
  if (!changed || status !== 'live') return null;
  return (
    <p className="landing-topic-note landing-topic-note--warn">
      This URL is in Google; changing it moves its ranking to the new URL, with
      a short dip. The new address takes effect on Apply changes, and the old
      one keeps working with a 308 redirect.
    </p>
  );
};

export default LandingPlaceSlugWarning;
