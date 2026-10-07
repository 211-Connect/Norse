'use client';

import { LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getDisplayHost } from '@/utils';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '../../../../shared/lib/analytics';
import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function WebsiteComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.website) {
    return null;
  }

  const host = getDisplayHost(resource.website);

  return (
    <Datum
      icon={LinkIcon}
      url={resource.website}
      urlTarget="_blank"
      title={t('website')}
      labelAs="h3"
      description={resource.website}
      urlAriaLabel={`${t('website')}: ${host}`}
      shouldParseHtml={false}
      onClick={() => {
        const resourceId = resource.id;
        trackEvent(AnalyticsEvent.WebsiteClick, AnalyticsTools.UmamiAndMatomo, {
          resourceId,
        });
      }}
    />
  );
}
