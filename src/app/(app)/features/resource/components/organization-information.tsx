'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { containsBlockElements } from '@/app/(app)/shared/lib/html-helpers';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function OrganizationInformation({ resource }) {
  const { t } = useTranslation('page-resource');

  const { organizationName, organizationDescription } = useMemo(() => {
    const { organizationName, organizationDescription } = resource ?? {};
    return { organizationName, organizationDescription };
  }, [resource]);

  const shouldRender = organizationName || organizationDescription;

  if (!shouldRender) {
    return null;
  }

  return (
    <Card className="print:border-none print:shadow-none">
      <CardHeader>
        <CardDescription>{t('providing_organization')}</CardDescription>
      </CardHeader>
      <CardContent>
        {organizationName && (
          <p className="mt-[6px] font-medium">{organizationName}</p>
        )}
        {organizationDescription &&
          (containsBlockElements(organizationDescription) ? (
            <div className="mt-4 flex flex-col gap-4 whitespace-break-spaces">
              {parseHtml(organizationDescription)}
            </div>
          ) : (
            <p className="mt-4 whitespace-break-spaces">
              {parseHtml(organizationDescription)}
            </p>
          ))}
      </CardContent>
    </Card>
  );
}
