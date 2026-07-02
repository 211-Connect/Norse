'use client';

import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { NEW_TAB_WARNING } from '../lib/constants';
import { parseHtml } from '../lib/parse-html';
import { cn } from '../lib/utils';
import { Link } from './link';
import { buttonVariants } from './ui/button';

export function Footer() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const brand = appConfig.brand.copyright || appConfig.brand.name;

  return (
    <footer className="px-3 pt-12 pb-3">
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
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center justify-center gap-3">
              {appConfig.pages.privacyPolicyPage.enabled && (
                <li>
                  <Link
                    href="/legal/privacy-policy"
                    className={buttonVariants({ variant: 'link' })}
                  >
                    {appConfig.pages.privacyPolicyPage.title}
                  </Link>
                </li>
              )}

              {appConfig.pages.termsOfUsePage.enabled && (
                <li>
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'link' }),
                      'text-primary! whitespace-pre-wrap',
                    )}
                    href="/legal/terms-of-use"
                  >
                    {appConfig.pages.termsOfUsePage.title}
                  </Link>
                </li>
              )}

              {appConfig.pages.accessibilityPage.enabled && (
                <li>
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'link' }),
                      'text-primary! whitespace-pre-wrap',
                    )}
                    href="/legal/accessibility"
                  >
                    {appConfig.pages.accessibilityPage.title}
                  </Link>
                </li>
              )}

              {appConfig.footer.customMenu.map((el) => (
                <li key={el.name}>
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'link' }),
                      'text-primary! flex items-center gap-3 whitespace-pre-wrap',
                    )}
                    target={el.openInNewTab ? '_blank' : undefined}
                    {...(el.openInNewTab && {
                      'aria-label': `${el.name}${NEW_TAB_WARNING}`,
                    })}
                    {...(el.href != null ? { href: el.href } : { href: '' })}
                  >
                    {el.name}
                    {el.openInNewTab && (
                      <span className="sr-only">{NEW_TAB_WARNING}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
