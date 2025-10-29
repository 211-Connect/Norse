'use client';

import { Link } from '@/app/(app)/shared/components/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export function NoFavoritesCard() {
  const { t } = useTranslation('page-list');

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
        <CardTitle>{t('no_favorites.title')}</CardTitle>
        <CardDescription>
          <Link href="/search" className="underline">
            {t('no_favorites.subtitle')}
          </Link>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
