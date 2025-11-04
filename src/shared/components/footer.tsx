import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Link } from './link';
import { DotIcon } from 'lucide-react';
import { Button } from './ui/button';
import { parseHtml } from '../lib/parse-html';

export function Footer() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const brand = appConfig?.brand?.copyright || appConfig?.brand?.name;

  return (
    <footer className="px-3 pb-3 pt-12">
      {appConfig.footer?.disclaimer && (
        <p className="mb-3 text-sm">{parseHtml(appConfig.footer.disclaimer)}</p>
      )}
      <div className="flex items-center gap-3 text-xs font-medium">
        <p>
          {t('footer.copyright', {
            text: `${new Date().getFullYear()}${brand ? ` ${brand}` : ''}`,
          })}
        </p>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {appConfig?.pages?.privacyPolicy?.enabled && (
            <Button variant="link">
              <Link href="/legal/privacy-policy">
                {t('privacy_policy.title', {
                  ns: 'dynamic',
                })}
              </Link>
            </Button>
          )}

          {appConfig?.pages?.termsOfUse?.enabled && (
            <Button variant="link">
              <Link className="!text-primary" href="/legal/terms-of-use">
                {t('terms_of_use.title', {
                  ns: 'dynamic',
                })}
              </Link>
            </Button>
          )}

          {appConfig?.menus?.footer?.map((el) => (
            <Button key={el.name} variant="link">
              <Link
                className="flex items-center gap-3 !text-primary"
                target={el.target}
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
