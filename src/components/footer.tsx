'use client';
import { DotIcon } from 'lucide-react';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn-utils';
import { Link } from '@/i18n/navigation';

type Props = {
  fullWidth?: boolean;
};

export function Footer(props: Props) {
  const appConfig = useAppConfig();
  const t = useTranslations('common');

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
            &copy; {new Date().getFullYear()} {appConfig?.brandName}.{' '}
            {t('footer.copyright')}
          </p>

          <div className="flex items-center gap-4 print:hidden">
            <Link
              href="/legal/privacy-policy"
              className="border-b-2 border-b-transparent py-1 transition-all hover:border-b-primary"
            >
              {t('footer.privacy_policy')}
            </Link>

            {appConfig?.footerMenu?.map((el) => (
              <Link
                key={el.name}
                className="flex items-center gap-1 border-b-2 border-b-transparent py-1 transition-all hover:border-b-primary"
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
