import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { parseHtml } from '@/shared/lib/parse-html';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

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
        {organizationDescription && (
          <p className="mt-4">{parseHtml(organizationDescription)}</p>
        )}
      </CardContent>
    </Card>
  );
}
