import { IResource } from '@/types/resource';
import { LanguagesIcon } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function Languages({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (data?.languages instanceof Array && data?.languages?.length === 0)
    return null;

  if ((data?.languages?.length ?? 0) === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <LanguagesIcon className="size-4" />

        <p className="font-semibold">{t('languages')}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {data?.languages?.map((el: string) => (
          <p key={el} className="text-sm">
            {el}
          </p>
        ))}
      </div>
    </div>
  );
}
