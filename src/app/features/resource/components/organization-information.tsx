'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { parseHtml } from '@/app/shared/lib/parse-html';
import { useTranslation } from 'react-i18next';

export function OrganizationInformation({ resource }) {
  const { t } = useTranslation('page-resource');

  return (
    <Card className="print:border-none print:shadow-none">
      <CardHeader>
        <CardTitle>{t('agency_info')}</CardTitle>
        <CardDescription>{resource.organizationName}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{parseHtml(resource.organizationDescription ?? '')}</p>
      </CardContent>
    </Card>
  );
}
