import { Card, CardContent } from '@/components/ui/card';
import { IResource } from '@/types/resource';
import { useTranslation } from 'next-i18next';
import RenderHtml from '@/components/render-html';

type Props = {
  data: IResource;
};

export function ResourceOrganization({ data }: Props) {
  const { t } = useTranslation('page-resource');

  if (!data?.organization?.name && !data?.organization?.description)
    return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-2xl font-bold">{t('agency_info')}</h3>
        {data?.organization?.name && (
          <p className="text-lg font-semibold">{data.organization.name}</p>
        )}

        {data?.organization?.description && (
          <RenderHtml html={data.organization.description} />
        )}
      </CardContent>
    </Card>
  );
}
