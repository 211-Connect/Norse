'use client';

import { LinkIcon } from 'lucide-react';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';
import { ResourceComponentProps } from '../component-registry';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';

function getDisplayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function WebsiteComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.website) {
    return null;
  }

  const displayHost = getDisplayHost(resource.website);

  return (
    <Datum
      icon={LinkIcon}
      url={resource.website}
      urlTarget="_blank"
      title={t('website')}
      description={displayHost}
      urlAriaLabel={`${t('website')}: ${displayHost}`}
      shouldParseHtml={false}
      onClick={() =>
        trackUmamiEvent(UmamiEvent.WebsiteClick, {
          resourceId: resource.id,
        })
      }
    />
  );
}
