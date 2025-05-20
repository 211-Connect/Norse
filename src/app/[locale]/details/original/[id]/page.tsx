import { ResourceTemplate } from '@/features/resource/templates/resource-template';
import { PREV_SEARCH } from '@/lib/constants';
import { fetchOriginalResource } from '@/lib/server/fetch-original-resource';
import { loadMessages } from '@/lib/server/load-messages';
import { NextIntlClientProvider } from 'next-intl';
import { cookies } from 'next/headers';

type DetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DetailsPage({ params }: DetailsPageProps) {
  const [pageParams, messages, cookieStore] = await Promise.all([
    params,
    loadMessages('resource'),
    cookies(),
  ]);

  const prevSearch = cookieStore.get(PREV_SEARCH)?.value;
  const { data } = await fetchOriginalResource(pageParams.id);

  return (
    <NextIntlClientProvider messages={messages}>
      <ResourceTemplate resource={data} prevSearch={prevSearch} />
    </NextIntlClientProvider>
  );
}
