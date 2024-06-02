import { Anchor } from '@/components/anchor';
import { IResource } from '@/types/resource';
import { IconMail } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function EmailAddress({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.email) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconMail className="size-4" />

        <p className="font-semibold">{t('email')}</p>
      </div>
      <Anchor className="text-sm" href={`mailto:${data.email}`}>
        {data.email}
      </Anchor>
    </div>
  );
}
