import { Card, CardContent } from '@/components/ui/card';
import { Resource } from '@/lib/server/adapters/resource-adapter';
import { parseHtml } from '@/utils/parseHtml';
import { useTranslation } from 'next-i18next';

type Props = {
  data: Resource;
};

export function ResourceOrganization({ data }: Props) {
  const { t } = useTranslation('page-resource');

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-2xl font-bold">{t('agency_info')}</h3>
        <p className="text-lg font-semibold">{data.organizationName}</p>

        <p className="whitespace-pre-wrap prose">
          {parseHtml(data.organizationDescription ?? '')}
        </p>
      </CardContent>
    </Card>
  );
}
