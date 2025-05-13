import { getLocale, getMessages } from 'next-intl/server';

export async function loadMessages(pageName: string) {
  const locale = await getLocale();
  const commonMessages = await getMessages();
  const pageMessages = (
    await import(`../../../messages/${locale}/${pageName}.json`)
  ).default;

  return {
    common: commonMessages.common,
    page: pageMessages,
  };
}
