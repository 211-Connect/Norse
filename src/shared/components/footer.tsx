import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { cn } from '../lib/utils';
import { Link } from './link';
import { DotIcon } from 'lucide-react';

type Props = {
  fullWidth?: boolean;
};

export function Footer(props: Props) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  return (
    <footer className="bg-white">
      <div
        className={cn(
          props.fullWidth ? '100%' : 'container mx-auto',
          'flex items-center justify-center pb-4 pt-4',
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            {appConfig?.brand?.copyright || appConfig?.brand?.name}.{' '}
            {t('footer.copyright')}
          </p>

          <div className="flex items-center gap-4 print:hidden">
            {appConfig?.pages?.privacyPolicy?.enabled && (
              <Link href="/legal/privacy-policy">
                {t('privacy_policy.title', {
                  ns: 'dynamic',
                })}
              </Link>
            )}

            {appConfig?.pages?.termsOfUse?.enabled && (
              <Link href="/legal/terms-of-use">
                {t('terms_of_use.title', {
                  ns: 'dynamic',
                })}
              </Link>
            )}

            {appConfig?.menus?.footer?.map((el) => (
              <Link
                key={el.name}
                className="flex items-center gap-1"
                target={el.target}
                {...(el.href != null ? { href: el.href } : { href: '' })}
              >
                <DotIcon className="size-4" />
                {el.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
