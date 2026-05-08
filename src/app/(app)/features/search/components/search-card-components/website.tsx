'use client';

import { getDisplayHost } from '@/utils/getDisplayHost';
import { Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UmamiEvent, trackUmamiEvent } from '../../../../shared/lib/umami';
import { Datum } from '../../../resource/components/datum';
import { SearchCardComponentProps } from './types';

export function WebsiteComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!result.website) {
    return null;
  }

  const host = getDisplayHost(result.website);

  return (
    <Datum
      key={result.website}
      icon={Link}
      iconColor="text-primary"
      description={result.website}
      url={result.website}
      urlTarget="_blank"
      urlAriaLabel={`${t('website')}: ${host}`}
      shouldParseHtml={false}
      className="py-0"
      onClick={() =>
        trackUmamiEvent(UmamiEvent.WebsiteClick, {
          resourceId: result.id,
        })
      }
    />
  );
}
