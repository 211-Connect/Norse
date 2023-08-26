import './globals.css';
import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import { createTranslator, NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import Header from '../../components/organisms/Header';

const openSans = Open_Sans({ subsets: ['latin'] });

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export async function generateMetadata({ params: { locale } }: Props) {
  const messages = await getMessages(locale);

  // You can use the core (non-React) APIs when you have to use next-intl
  // outside of components. Potentially this will be simplified in the future
  // (see https://next-intl-docs.vercel.app/docs/next-13/server-components).
  const t = createTranslator({ locale, messages });

  return {
    title: 'Community resource directory',
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const messages = await getMessages(params.locale);

  return (
    <html lang={params.locale}>
      <body className={openSans.className}>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <Header />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
