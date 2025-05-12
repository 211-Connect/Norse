'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useTranslations } from 'next-intl';

export function DataProviders() {
  const appConfig = useAppConfig();
  const t = useTranslations('common');

  return (
    <>
      {appConfig?.dataProviders?.length && (
        <>
          <div className="container mx-auto flex flex-col pb-8 pt-8">
            <h3 className="text-lg font-semibold">
              {t('data_providers.provided_by')}
            </h3>

            <Separator className="mb-4" />

            <div
              className={cn(
                appConfig.dataProviders.length >= 4 &&
                  'grid-cols-1 justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                appConfig.dataProviders.length === 3 &&
                  'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                appConfig.dataProviders.length === 2 &&
                  'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2',
                appConfig.dataProviders.length === 1 &&
                  'mx-auto max-w-fit grid-cols-1',
                'grid gap-4',
              )}
            >
              {appConfig.dataProviders.map((el: any) => (
                <Link
                  key={el.name}
                  href={el.href}
                  target="_blank"
                  className="group self-stretch hover:underline"
                >
                  <Card className="h-full transition-all group-hover:shadow-sm">
                    <CardHeader className="transition-all group-hover:translate-x-1">
                      <CardTitle>{el.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="transition-all group-hover:translate-x-1">
                      <Image
                        src={el.logo}
                        alt=""
                        width={200}
                        height={0}
                        style={{ width: '200px', height: 'auto' }}
                      />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
