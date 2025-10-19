'use client';

import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { MainSearchLayout } from '@/app/shared/components/search/main-search-layout';
import {
  LayoutGrid,
  Mail,
  MessageCircleMore,
  PhoneOutgoing,
  Smartphone,
} from 'lucide-react';
import { ReactElement, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/app/shared/components/link';

export function NewHomeContent() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('dynamic');

  const callouts = useMemo(() => {
    return (
      appConfig.newLayoutCallouts?.options?.map(
        ({ type, title: titleOrigin, urlTarget, customImg, ...rest }) => {
          const lowercasedType = type.toLowerCase();

          const title =
            titleOrigin ||
            t(`new_layout.callouts.list.${lowercasedType}`, {
              ns: 'page-home',
            });

          let icon: ReactElement | null = null;

          if (customImg) {
            icon = (
              <Image
                src={customImg}
                alt={title}
                className="size-12"
                width={48}
                height={48}
              />
            );
          } else {
            switch (lowercasedType) {
              case 'call':
                icon = (
                  <PhoneOutgoing
                    strokeWidth={1}
                    className="size-12 text-primary"
                  />
                );
                break;
              case 'sms':
                icon = (
                  <Smartphone
                    strokeWidth={1}
                    className="size-12 text-primary"
                  />
                );
                break;
              case 'chat':
                icon = (
                  <MessageCircleMore
                    strokeWidth={1}
                    className="size-12 text-primary"
                  />
                );
                break;
              case 'email':
                icon = (
                  <Mail strokeWidth={1} className="size-12 text-primary" />
                );
                break;
              default:
                icon = null;
            }
          }

          return {
            ...rest,
            icon,
            type: lowercasedType,
            title,
            urlTarget: urlTarget || '_blank',
          };
        },
      ) ?? []
    );
  }, [appConfig.newLayoutCallouts?.options, t]);

  return (
    <div className="relative flex flex-1 justify-center border-t px-3 lg:justify-start lg:pl-8 lg:pr-0">
      <div className="flex min-h-full flex-row px-0">
        <div className="flex flex-col items-start justify-around gap-16 py-6 pl-0 lg:w-[430px] lg:pr-6">
          <div className="w-full">
            <h3 className="mb-2 whitespace-break-spaces text-2xl font-medium text-primary">
              {t('search.hero_title', {
                ns: 'dynamic',
                defaultValue: t('search.hero_title', { ns: 'common' }),
              })}
            </h3>
            <MainSearchLayout />
          </div>
          <div>
            <h3 className="whitespace-break-spaces text-xl text-black opacity-50">
              {t('new_layout.topics_section.title', { ns: 'page-home' })}
            </h3>
            <Link
              href="/topics"
              className="flex items-center gap-3 text-3xl font-medium hover:underline"
            >
              {t('new_layout.topics_section.cta', { ns: 'page-home' })}
              <LayoutGrid strokeWidth={1} className="size-12 text-primary" />
            </Link>
          </div>
          {callouts.length > 0 && (
            <div className="w-full">
              <h3 className="mb-3 whitespace-break-spaces text-xl text-black opacity-50">
                {appConfig.newLayoutCallouts?.title ||
                  t('new_layout.other_ways_section.title', { ns: 'page-home' })}
              </h3>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                {callouts.map(
                  (
                    { icon, title, description, url, urlTarget, type },
                    index,
                  ) =>
                    url ? (
                      <Link
                        href={url}
                        target={urlTarget}
                        className="flex flex-col items-center gap-[10px] px-4 py-[10px] [&>p]:hover:underline"
                        key={`${type}-${index}`}
                      >
                        {icon}
                        <p className="text-center text-xl font-semibold">
                          {title}
                        </p>
                        {description && (
                          <p className="whitespace-pre-wrap text-center text-sm">
                            {description}
                          </p>
                        )}
                      </Link>
                    ) : (
                      <div
                        className="flex flex-col items-center gap-3 px-4 py-3"
                        key={`${type}-${index}`}
                      >
                        {icon}
                        <p className="text-center text-xl font-semibold">
                          {title}
                        </p>
                        {description && (
                          <p className="whitespace-pre-wrap text-center text-sm">
                            {description}
                          </p>
                        )}
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-0 hidden h-full w-[calc(100vw-462px)] lg:block">
          <img
            className="h-full w-full object-cover"
            src={appConfig?.newLayout?.heroUrl}
            alt="Hero image"
          />
        </div>
      </div>
    </div>
  );
}
