import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  return (
    <>
      {appConfig.providers.length > 0 && (
        <>
          <div className="container mx-auto flex flex-col">
            <h3 className="text-center">{t('data_providers.provided_by')}</h3>

            <div className="grid grid-cols-4">
              {appConfig.providers.map((el: any) => (
                <div key={el.name}>
                  <Link href={el.href} target="_blank">
                    <Card>
                      <CardHeader>
                        <CardTitle>{el.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
