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
import { sanitizeSessionForClient } from '../shared/utils/sanitizeSession';
import { cookies } from 'next/headers';
import { USER_PREF_FONT_SIZE } from '../shared/lib/constants';
import {
  resolveBrandTheme,
  resolveHeaderGradient,
} from '../shared/theme/theme-config';
import { getContrastColor } from '@/utils';

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

  const { borderRadius, primaryColor, secondaryColor } = resolveBrandTheme(
    appConfig.brand.theme,
  );
  const { headerStart, headerEnd } = resolveHeaderGradient(appConfig.newLayout);

  const primary = color(primaryColor).hsl();
  const primaryHsl = primary.array();
  const primaryForeground = primary.isDark() ? '0 0% 100%' : '0 0% 0%';

  // Compute a focus-ring color guaranteed to contrast with the primary surface.
  // getContrastColor applies the WCAG relative-luminance formula and returns
  // '#FFFFFF' (white) for dark primaries and '#000000' (black) for light ones.
  const ringOnPrimaryHex = getContrastColor(primaryColor);
  const ringOnPrimary = ringOnPrimaryHex === '#FFFFFF' ? '0 0% 100%' : '0 0% 3.9%';

  const secondary = color(secondaryColor).hsl();
  const secondaryHsl = secondary.array();
  const secondaryForeground = secondary.isDark() ? '0 0% 100%' : '0 0% 0%';

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
    '--ring-on-primary': ringOnPrimary,
    '--secondary': `${secondaryHsl[0]} ${secondaryHsl[1]}% ${secondaryHsl[2]}%`,
    '--secondary-foreground': secondaryForeground,
    '--border-radius': borderRadius,
    '--header-start': headerStart,
    '--header-end': headerEnd,
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
  const clientSession = sanitizeSessionForClient(session);

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
        <Providers appConfig={appConfig} session={clientSession}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
