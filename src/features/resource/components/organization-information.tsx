'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { parseHtml } from '@/shared/lib/parse-html';
import { Resource } from '@/types/resource';
import { useTranslations } from 'next-intl';

type OrganizationInformationProps = {
  resource: Resource;
};

export function OrganizationInformation({
  resource,
}: OrganizationInformationProps) {
  const t = useTranslations('page');

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
