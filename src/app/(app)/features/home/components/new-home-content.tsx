'use client';

import {
  LayoutGrid,
  Mail,
  MessageCircleMore,
  PhoneOutgoing,
  Smartphone,
} from 'lucide-react';
import { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Image } from '@/app/(app)/shared/components/image';
import { Link } from '@/app/(app)/shared/components/link';
import { MainSearchLayout } from '@/app/(app)/shared/components/search/main-search-layout/main-search-layout';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { UmamiEvent, trackUmamiEvent } from '@/app/(app)/shared/lib/umami';

import Alert from './alert';

export function NewHomeContent() {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  const callouts = useMemo(() => {
    return (
      appConfig.newLayout?.callouts?.options?.map(
        ({ type, title: titleOrigin, urlTarget, customImg, ...rest }) => {
          const lowercasedType = type.toLowerCase();

          const title =
            titleOrigin ||
            t(`new_layout.callouts.list.${lowercasedType}`, {
              ns: 'page-home',
            });

          let icon: ReactElement | null;

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
                    className="text-primary size-12"
                  />
                );
                break;
              case 'sms':
                icon = (
                  <Smartphone
                    strokeWidth={1}
                    className="text-primary size-12"
                  />
                );
                break;
              case 'chat':
                icon = (
                  <MessageCircleMore
                    strokeWidth={1}
                    className="text-primary size-12"
                  />
                );
                break;
              case 'email':
                icon = (
                  <Mail strokeWidth={1} className="text-primary size-12" />
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
  }, [appConfig.newLayout?.callouts?.options, t]);

  return (
    <div className="relative flex flex-1 justify-center border-t px-3 lg:justify-start lg:pr-0 lg:pl-8">
      <div className="flex min-h-full flex-row px-0">
        <div className="flex flex-col items-start justify-around gap-4 py-6 pl-0 lg:w-[430px] lg:gap-8 lg:pr-[24px]">
          <Alert itemsDirection="col" />
          <div className="w-full">
            <h2 className="text-primary mb-2 text-2xl font-medium whitespace-break-spaces">
              {appConfig.search.texts?.title ||
                t('search.hero_title', { ns: 'common' })}
            </h2>
            <MainSearchLayout />
          </div>
          <div>
            <h3 className="text-xl whitespace-break-spaces text-black opacity-50">
              {t('new_layout.topics_section.title', { ns: 'page-home' })}
            </h3>
            <Link
              href="/topics"
              className="flex items-center gap-3 text-3xl font-medium hover:underline"
              prefetch={false}
            >
              {t('new_layout.topics_section.cta', { ns: 'page-home' })}
              <LayoutGrid strokeWidth={1} className="text-primary size-12" />
            </Link>
          </div>
          {callouts.length > 0 && (
            <div className="w-full">
              <h3 className="mb-3 text-xl whitespace-break-spaces text-black opacity-50">
                {appConfig.newLayout?.callouts?.title ||
                  t('new_layout.callouts.title', {
                    ns: 'page-home',
                  })}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(calc(50%-12px),127px),1fr))] justify-center gap-3 md:justify-start">
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
                        onClick={() =>
                          trackUmamiEvent(UmamiEvent.CalloutClick, { type })
                        }
                        prefetch={false}
                      >
                        {icon}
                        <p className="text-center text-xl font-semibold">
                          {title}
                        </p>
                        {description && (
                          <p className="text-center text-sm whitespace-pre-wrap">
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
                          <p className="text-center text-sm whitespace-pre-wrap">
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
        {appConfig?.newLayout?.heroUrl && (
          <div className="absolute right-0 hidden h-full w-[calc(100vw-(100vw-100%)-430px-2rem)] lg:block">
            <Image
              className="h-full w-full object-cover"
              fill
              src={appConfig.newLayout.heroUrl}
              alt="Hero image"
            />
          </div>
        )}
      </div>
    </div>
  );
}
