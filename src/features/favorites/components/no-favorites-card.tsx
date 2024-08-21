import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import Image from 'next/image';

export function NoFavoritesCard() {
  const { t } = useTranslation('page-list');

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
