'use client';

import { useTranslation } from 'react-i18next';

import { AppConfig } from '@/types/appConfig';

import { useAppConfig } from '../hooks/use-app-config';
import { getStableKey } from '../lib/get-stable-key';
import { LocalizedLink } from './LocalizedLink';
import { MediaCard } from './media-card';
import { SectionCarousel } from './section-carousel';

type Provider = NonNullable<AppConfig['providers']>[number];

export function DataProviders() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const validProviders =
    appConfig.providers?.filter((provider): provider is Provider =>
      Boolean(provider?.name || provider?.logo),
    ) || [];

  if (validProviders.length === 0) {
    return null;
  }

  const items = validProviders.map((provider, index) => {
    const key = getStableKey(
      [provider.href, provider.name, provider.logo],
      `provider-${index}`,
    );

    return provider.href ? (
      <LocalizedLink key={key} href={provider.href} target={provider.target}>
        <MediaCard
          title={provider.name}
          image={provider.logo}
          imageAlt={provider.name || ''}
        />
      </LocalizedLink>
    ) : (
      <div key={key}>
        <MediaCard
          title={provider.name}
          image={provider.logo}
          imageAlt={provider.name || ''}
        />
      </div>
    );
  });

  return (
    <SectionCarousel
      title={
        appConfig.providersCustomHeading || t('data_providers.provided_by')
      }
      items={items}
    />
  );
}
