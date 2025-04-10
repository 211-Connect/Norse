import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { useConfigStore } from '@/lib/context/config-context/config-store-provider';

export function DataProviders() {
  const dataProviders = useConfigStore((config) => config.dataProviders);
  const { t } = useTranslation();

  return (
    <>
      {dataProviders?.length > 0 && (
        <>
          <div className="container mx-auto flex flex-col pt-8 pb-8">
            <h3 className="text-lg font-semibold">
              {t('data_providers.provided_by')}
            </h3>

            <Separator className="mb-4" />

            <div
              className={cn(
                dataProviders.length >= 4 &&
                  'grid-cols-1 justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                dataProviders.length === 3 &&
                  'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                dataProviders.length === 2 &&
                  'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2',
                dataProviders.length === 1 && 'mx-auto max-w-fit grid-cols-1',
                'grid gap-4',
              )}
            >
              {dataProviders.map((el: any) => (
                <Link
                  key={el.name}
                  href={el.href}
                  target="_blank"
                  className="group self-stretch hover:underline"
                >
                  <Card className="h-full transition-all group-hover:shadow-xs">
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
