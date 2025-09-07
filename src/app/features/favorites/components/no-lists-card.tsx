'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export function NoListsCard() {
  const { t } = useTranslation('page-favorites');

  return (
    <Card>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src="/images/undraw_no_data.svg"
          alt="Illustration of no data"
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
