'use client';

import { LinkIcon } from 'lucide-react';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';
import { ResourceComponentProps } from '../component-registry';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';
import { getDisplayHost } from '@/utils';

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
