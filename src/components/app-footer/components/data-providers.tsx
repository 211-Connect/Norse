import Image from 'next/image';
import Link from 'next/link';
import { useAppConfig } from '@/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardHeader } from '../../ui/card';

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  return (
    <>
      {appConfig.providers.length > 0 && (
        <div className="flex container mx-auto pt-4 pb-4 flex-col">
          <h3 className="text-center text-lg font-bold">
            {t('data_providers.provided_by')}
          </h3>

          <div className="grid grid-cols-4">
            {appConfig.providers.map((el: any) => (
              <Link
                key={el.name}
                href={el.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-105 transition-all"
              >
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <h4 className="text-md font-semibold">{el.name}</h4>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <Image
                      src={el.logoUrl}
                      alt=""
                      width={200}
                      height={0}
                      className="w-[200px] h-auto"
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
