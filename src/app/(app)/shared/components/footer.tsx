'use client';

import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { Link } from './link';
import { Button } from './ui/button';
import { parseHtml } from '../lib/parse-html';

export function Footer() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const brand = appConfig.brand.copyright || appConfig.brand.name;

  return (
    <footer className="px-3 pb-3 pt-12">
      {appConfig.footer?.disclaimer && (
        <p className="mb-3 text-sm">{parseHtml(appConfig.footer.disclaimer)}</p>
      )}
      <div className="flex flex-col items-center gap-3 text-xs font-medium sm:flex-row">
        <p>
          {t('footer.copyright', {
            text: `${new Date().getFullYear()}${brand ? ` ${brand}` : ''}`,
          })}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          {appConfig.pages.privacyPolicyPage.enabled && (
            <Button variant="link">
              <Link href="/legal/privacy-policy">
                {appConfig.pages.privacyPolicyPage.title}
              </Link>
            </Button>
          )}

          {appConfig.pages.termsOfUsePage.enabled && (
            <Button variant="link">
              <Link
                className="whitespace-pre-wrap !text-primary"
                href="/legal/terms-of-use"
              >
                {appConfig.pages.termsOfUsePage.title}
              </Link>
            </Button>
          )}

          {appConfig.footer.customMenu.map((el) => (
            <Button key={el.name} variant="link">
              <Link
                className="flex items-center gap-3 whitespace-pre-wrap !text-primary"
                target={el.target ?? '_self'}
                {...(el.href != null ? { href: el.href } : { href: '' })}
              >
                {el.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
}
