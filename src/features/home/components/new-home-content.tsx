import { useTranslation } from 'next-i18next';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { MainSearchLayout } from '@/shared/components/search/main-search-layout';
import Link from 'next/link';
import {
  LayoutGrid,
  MessageCircleMore,
  PhoneOutgoing,
  Smartphone,
} from 'lucide-react';

export function NewHomeContent() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('dynamic');

  return (
    <div className="relative flex flex-1 justify-center border-t px-3 lg:justify-start lg:pl-8 lg:pr-0">
      <div className="flex min-h-full flex-row px-0">
        <div className="flex flex-col items-start gap-16 py-6 pl-0 lg:w-[430px] lg:pr-6">
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
          <div className="w-full">
            <h3 className="mb-3 whitespace-break-spaces text-xl text-black opacity-50">
              {t('new_layout.other_ways_section.title', { ns: 'page-home' })}
            </h3>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <div className="flex flex-col items-center gap-3 px-4 py-3">
                <PhoneOutgoing
                  strokeWidth={1}
                  className="size-12 text-primary"
                />
                <p className="text-xl font-semibold">
                  {t('new_layout.other_ways_section.list.call.title', {
                    ns: 'page-home',
                  })}
                </p>
                <p className="text-sm">
                  {t('new_layout.other_ways_section.list.call.subtitle', {
                    ns: 'page-home',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 px-4 py-3">
                <Smartphone strokeWidth={1} className="size-12 text-primary" />
                <p className="text-xl font-semibold">
                  {t('new_layout.other_ways_section.list.sms.title', {
                    ns: 'page-home',
                  })}
                </p>
                <p className="text-sm">
                  {t('new_layout.other_ways_section.list.sms.subtitle', {
                    ns: 'page-home',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 px-4 py-3">
                <MessageCircleMore
                  strokeWidth={1}
                  className="size-12 text-primary"
                />
                <p className="text-xl font-semibold">
                  {t('new_layout.other_ways_section.list.chat.title', {
                    ns: 'page-home',
                  })}
                </p>
                <p className="text-sm">
                  {t('new_layout.other_ways_section.list.chat.subtitle', {
                    ns: 'page-home',
                  })}
                </p>
              </div>
            </div>
          </div>
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
