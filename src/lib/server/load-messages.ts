import { getLocale, getMessages } from 'next-intl/server';
import { unstable_cache } from 'next/cache';

const getCachedMessages = unstable_cache(
  async (locale: string, pageName: string) => {
    const commonMessages = await getMessages({ locale });
    const pageMessages = (
      await import(`../../../messages/${locale}/${pageName}.json`)
    ).default;

    return {
      common: commonMessages.common,
      page: pageMessages,
    };
  },
  [],
  {
    revalidate: false,
  },
);

export async function loadMessages(pageName: string) {
  const locale = await getLocale();
  const response = await getCachedMessages(locale, pageName);
  return response;
}
