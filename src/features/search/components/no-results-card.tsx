import { useAppConfig } from '@/lib/context/app-config-context';
import { buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function NoResultsCard({ showAltSubtitle }) {
  const t = useTranslations('page');
  const appConfig = useAppConfig();
  const searchParams = useSearchParams();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('no_results.title')}</CardTitle>
        <CardDescription>
          {searchParams?.get('query_label') || searchParams?.get('query')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src="/undraw_searching.svg"
          width={0}
          height={150}
          alt=""
          style={{ height: '150px', width: 'auto' }}
        />
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-2">
        <p className="font-semibold">
          {!showAltSubtitle
            ? t('no_results.subtitle')
            : appConfig?.phoneNumber
              ? t('no_results.need_help')
              : t('search.no_results_fallback_text', {
                  ns: 'dynamic',
                  defaultValue: t('no_results.alt_subtitle'),
                })}
        </p>

        {appConfig?.phoneNumber && (
          <Link
            href={`tel:${appConfig.phoneNumber}`}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
          >
            <Phone className="size-4" /> {appConfig.phoneNumber}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
