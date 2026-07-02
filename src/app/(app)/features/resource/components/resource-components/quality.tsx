'use client';

import { ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

import { Datum } from '../datum';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function QualityComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const qualityLinks = useMemo(
    () =>
      (resource.linkQualityUrls ?? []).filter(
        ({ displayText, url }) => Boolean(displayText) && Boolean(url),
      ),
    [resource.linkQualityUrls],
  );

  if (qualityLinks.length === 0) {
    return null;
  }

  const qualityLinksMarkup = qualityLinks
    .map(
      ({ displayText, url }) =>
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayText)}</a>`,
    )
    .join('');

  return (
    <Datum
      icon={ShieldCheck}
      title={t('quality', { defaultValue: 'Quality' })}
      labelAs="h3"
      description={`<div class="flex flex-col gap-1">${qualityLinksMarkup}</div>`}
    />
  );
}
