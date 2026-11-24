'use client';

import { useFormFields } from '@payloadcms/ui';

import {
  COPY_FIELDS,
  COPY_SOURCES,
  type CopyTexts,
  fillCopy,
} from '@/app/(app)/features/landing-pages/lib/copy';

import type { CopyScope } from '../copyFields';
import './LandingCopyFields.css';
import { groupPath, useLandingCopyContext } from './useLandingCopyContext';

const cut = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/**
 * Roughly how Google shows the page, from the form's unsaved copy and what
 * it inherits. On templates and topics it uses a sample page.
 */
const LandingCopyPreview = ({
  path,
  scope,
}: {
  path: string;
  scope: CopyScope;
}) => {
  const base = groupPath(path);
  const context = useLandingCopyContext(scope);
  const own = useFormFields(([fields]) =>
    Object.fromEntries(
      COPY_FIELDS.map((name) => [
        name,
        fields[base ? `${base}.${name}` : name]?.value as string | undefined,
      ]),
    ),
  ) as CopyTexts;

  if (!context) return null;
  // Only the edited layer and what it inherits: on the templates, a sample
  // topic's own copy must not hide the template being edited.
  const below = COPY_SOURCES.slice(COPY_SOURCES.indexOf(scope) + 1);
  const layers = Object.fromEntries(
    below.map((source) => [source, context.layers[source]]),
  );
  const copy = fillCopy({ ...layers, [scope]: own }, context.values);
  // A sample without a page has no URL yet.
  const parts = (context.path ?? '/…').split('/').filter(Boolean);

  return (
    <div className="landing-copy-preview">
      <p className="landing-copy-preview__label">
        Google preview, with a sample page: {context.values.topic} in{' '}
        {context.values.location}
      </p>
      <div className="landing-copy-preview__result">
        <div className="landing-copy-preview__url">
          {context.host ?? 'example.org'}
          {parts.map((part) => ` › ${part}`)}
        </div>
        <div className="landing-copy-preview__title">{cut(copy.title, 60)}</div>
        <div className="landing-copy-preview__description">
          {cut(copy.description, 160)}
        </div>
      </div>
      <div className="landing-copy-preview__page">
        <strong>{copy.h1}</strong>
        <p>{copy.intro}</p>
      </div>
    </div>
  );
};

export default LandingCopyPreview;
