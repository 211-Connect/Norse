import { Metadata, Viewport } from 'next/types';

import '@/app/(app)/shared/styles/globals.css';
import '@/app/(app)/shared/styles/map.css';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { cn } from '../shared/lib/utils';
import color from 'color';
import { getAppConfigWithoutHost } from '../shared/utils/appConfig';
import { AppConfig } from '@/types/appConfig';
import { notFound } from 'next/navigation';
import { Providers } from '../shared/components/providers';
import { getSession } from '../shared/utils/getServerSession';
import { cookies } from 'next/headers';
import { USER_PREF_FONT_SIZE } from '../shared/lib/constants';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const favicon = appConfig.brand.faviconUrl ?? '/favicon.ico';

  return {
    description: appConfig.meta.description,
    icons: {
      icon: favicon,
    },
    title: appConfig.meta.title,
  };
};

async function prepareTheme(appConfig: AppConfig) {
  const cookieList = await cookies();

  const {
    borderRadius: borderRadiusFromTheme,
    primaryColor,
    secondaryColor,
  } = appConfig.brand.theme;
  const { headerStart, headerEnd } = appConfig.newLayout ?? {};

  const primary = color(primaryColor).hsl();
  const primaryHsl = primary.array();
  const primaryForeground = primary.isDark() ? '0 0% 100%' : '0 0% 0%';

  const secondary = color(secondaryColor).hsl();
  const secondaryHsl = secondary.array();
  const secondaryForeground = secondary.isDark() ? '0 0% 100%' : '0 0% 0%';

  const borderRadius = borderRadiusFromTheme ?? '0.5rem';

  let savedFontSize: string | undefined = undefined;

  if (appConfig.accessibility.fontSize.allowedValues.length > 1) {
    const fontSizeCookie = cookieList.get(USER_PREF_FONT_SIZE);

    if (
      fontSizeCookie &&
      appConfig.accessibility.fontSize.allowedValues.includes(
        fontSizeCookie.value,
      )
    ) {
      savedFontSize = fontSizeCookie.value;
    }
  }

  return {
    '--primary': `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`,
    '--primary-foreground': primaryForeground,
    '--secondary': `${secondaryHsl[0]} ${secondaryHsl[1]}% ${secondaryHsl[2]}%`,
    '--secondary-foreground': secondaryForeground,
    '--border-radius': borderRadius,
    '--header-start': headerStart || '#ffffff',
    '--header-end': headerEnd || '#ffffff',
    'font-size': savedFontSize,
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const session = await getSession();

  if (appConfig.brand.name === '') {
    notFound();
  }

  const theme = await prepareTheme(appConfig);

  return (
    <html lang={locale} style={theme as any} className="max-sm:!text-[100%]">
      <body
        className={cn('font-sans antialiased', fontSans.variable)}
        id="app-root"
      >
        <Providers appConfig={appConfig} session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
