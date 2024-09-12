import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

export function NoListsCard() {
  const { t } = useTranslation('page-favorites');

  return (
    <Card>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src="/undraw_no_data.svg"
          alt=""
          height={150}
          width={0}
          style={{
            height: '150px',
            width: 'auto',
          }}
        />
      </CardContent>
      <CardHeader className="text-center">
        <CardTitle>{t('no_lists')}</CardTitle>
      </CardHeader>
    </Card>
  );
}
