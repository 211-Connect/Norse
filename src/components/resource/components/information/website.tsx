import { Anchor } from '@/components/anchor';
import { IResource } from '@/types/resource';
import { IconWorldWww } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function Website({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.website) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconWorldWww className="size-4" />

        <p className="font-semibold">{t('website')}</p>
      </div>
      <Anchor
        className="text-sm"
        href={data.website}
        rel="noopener noreferrer"
        target="_blank"
      >
        {data.website}
      </Anchor>
    </div>
  );
}
