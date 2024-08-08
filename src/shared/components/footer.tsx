import { useTranslation } from 'next-i18next';
import { IconPointFilled } from '@tabler/icons-react';
import { useAppConfig } from '../hooks/use-app-config';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { Link } from './ui/link';
import { ReactNode } from 'react';

type Props = {
  fullWidth?: boolean;
  children?: ReactNode;
};

export function Footer(props: Props) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  return (
    <div className=" bg-white">
      <Separator />

      {props.children}

      <footer>
        <div
          className={cn(
            props.fullWidth ? '100%' : 'container mx-auto',
            'pt-4 pb-4 flex items-center justify-center'
          )}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <p>
              &copy; {new Date().getFullYear()} {appConfig?.brand?.name}.{' '}
              {t('footer.copyright')}
            </p>

            <div className="flex gap-4 items-center">
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
                    <IconPointFilled className="size-4" />
                    {el.name}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
