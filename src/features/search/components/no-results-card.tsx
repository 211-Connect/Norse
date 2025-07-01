import { Button, buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { cn } from '@/shared/lib/utils';
import { Phone } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export function NoResultsCard({ showAltSubtitle }) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('no_results.title')}</CardTitle>
        <CardDescription>
          {router.query.query_label || router.query.query}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src={`${router.basePath}/undraw_searching.svg`}
          width={0}
          height={150}
          alt="Illustration of a person searching"
          style={{ height: '150px', width: 'auto' }}
        />
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-2">
        <p className="font-semibold">
          {!showAltSubtitle
            ? t('no_results.subtitle')
            : appConfig?.contact?.number
              ? t('no_results.need_help')
              : t('search.no_results_fallback_text', {
                  ns: 'dynamic',
                  defaultValue: t('no_results.alt_subtitle'),
                })}
        </p>

        {appConfig?.contact?.number && (
          <Link
            href={`tel:${appConfig.contact.number}`}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
          >
            <Phone className="size-4" /> {appConfig.contact.number}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
