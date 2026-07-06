'use client';

import { LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getDisplayHost } from '@/utils';

import { UmamiEvent, trackUmamiEvent } from '../../../../shared/lib/umami';
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
      onClick={() =>
        trackUmamiEvent(UmamiEvent.WebsiteClick, {
          resourceId: resource.id,
        })
      }
    />
  );
}
