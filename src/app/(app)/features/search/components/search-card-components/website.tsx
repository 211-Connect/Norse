'use client';

import { useTranslation } from 'react-i18next';
import { Link } from 'lucide-react';
import { getDisplayHost } from '@/utils/getDisplayHost';
import { SearchCardComponentProps } from './types';
import { Datum } from '../../../resource/components/datum';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';

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
