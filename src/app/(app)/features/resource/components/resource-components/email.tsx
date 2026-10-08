'use client';

import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '../../../../shared/lib/analytics';
import { Datum } from '../datum';

export function EmailComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.email) {
    return null;
  }

  return (
    <Datum
      icon={Send}
      title={t('email')}
      labelAs="h3"
      description={resource.email}
      url={`mailto:${resource.email}`}
      onClick={() =>
        trackEvent(AnalyticsEvent.EmailClick, AnalyticsTools.Matomo, {
          resourceId: resource.id,
        })
      }
      shouldParseHtml={false}
    />
  );
}
