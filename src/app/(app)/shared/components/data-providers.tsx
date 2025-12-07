'use client';

import { Image } from '@/app/(app)/shared/components/image';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { LocalizedLink } from './LocalizedLink';

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const validProviders =
    appConfig.providers?.filter(
      (provider: any) => provider.name || provider.logo,
    ) || [];

  if (validProviders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto flex flex-col pb-8 pt-8">
        {!appConfig.featureFlags.hideDataProvidersHeading && (
          <>
            <h3 className="text-center text-lg font-bold">
              {appConfig.providersCustomHeading ||
                t('data_providers.provided_by')}
            </h3>

            <Separator className="mb-4 mt-3" />
          </>
        )}

        <div
          className={cn(
            validProviders.length >= 4 &&
              'grid-cols-1 justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            validProviders.length === 3 &&
              'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            validProviders.length === 2 &&
              'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2',
            validProviders.length === 1 && 'mx-auto max-w-fit grid-cols-1',
            'grid gap-4',
          )}
        >
          {validProviders.map((el: any) => {
            const key = el.name || `provider-${Math.random()}`;
            const CardNameAndLogoComponent = (
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
            );
            const CardNameOrLogoComponent = (
              <Card className="flex h-full items-center justify-center transition-all group-hover:shadow-sm">
                <CardHeader className="transition-all group-hover:translate-x-1">
                  {el.name && <CardTitle>{el.name}</CardTitle>}
                  {el.logo && (
                    <Image
                      src={el.logo}
                      alt=""
                      width={200}
                      height={0}
                      style={{ width: '200px', height: 'auto' }}
                    />
                  )}
                </CardHeader>
              </Card>
            );

            const CardComponent =
              el.name && el.logo
                ? CardNameAndLogoComponent
                : CardNameOrLogoComponent;

            return el.href ? (
              <LocalizedLink
                key={key}
                href={el.href}
                target={el.target}
                className="group self-stretch hover:underline"
              >
                {CardComponent}
              </LocalizedLink>
            ) : (
              <div key={key} className="group self-stretch">
                {CardComponent}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
