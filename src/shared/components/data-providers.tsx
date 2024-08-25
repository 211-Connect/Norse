import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  return (
    <>
      {appConfig.providers.length > 0 && (
        <>
          <div className="container mx-auto flex flex-col pb-8 pt-8">
            <h3 className="text-lg font-semibold">
              {t('data_providers.provided_by')}
            </h3>

            <Separator className="mb-4" />

            <div className="grid grid-cols-4">
              {appConfig.providers.map((el: any) => (
                <Link
                  key={el.name}
                  href={el.href}
                  target="_blank"
                  className="group hover:underline"
                >
                  <Card className="transition-all group-hover:shadow-sm">
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
