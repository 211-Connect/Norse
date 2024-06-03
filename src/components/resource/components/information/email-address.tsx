import { Anchor } from '@/components/anchor';
import { IResource } from '@/types/resource';
import { Mail } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function EmailAddress({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.email) return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Mail className="size-4" />

        <p className="font-semibold">{t('email')}</p>
      </div>
      <Anchor className="text-sm" href={`mailto:${data.email}`}>
        {data.email}
      </Anchor>
    </div>
  );
}
