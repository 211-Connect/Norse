import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../hooks/use-app-config';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { Link } from './ui/link';
import { ReactNode } from 'react';
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
            &copy; {new Date().getFullYear()} {appConfig?.brand?.name}.{' '}
            {t('footer.copyright')}
          </p>

          <div className="flex items-center gap-4">
            <Link href="/legal/privacy-policy">
              {t('footer.privacy_policy')}
            </Link>

            {appConfig?.menus?.footer?.map(
              (el: { name: string; href: string | null }) => (
                <Link
                  key={el.name}
                  className="flex items-center gap-1"
                  {...(el.href != null ? { href: el.href } : { href: '' })}
                >
                  <DotIcon className="size-4" />
                  {el.name}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
