'use client';
import { cn } from '../lib/utils';
import { Link } from './link';
import { DotIcon } from 'lucide-react';
import { useConfigStore } from '@/lib/context/config-context/config-store-provider';
import { useTranslations } from 'next-intl';

type Props = {
  fullWidth?: boolean;
};

export function Footer(props: Props) {
  const t = useTranslations('Footer');
  const brand = useConfigStore((config) => config.brand);
  const menus = useConfigStore((config) => config.menus);

  return (
    <footer className="bg-white">
      <div
        className={cn(
          props.fullWidth ? '100%' : 'container mx-auto',
          'flex items-center justify-center pt-4 pb-4',
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <p>
            &copy; {new Date().getFullYear()} {brand?.name}. {t('copyright')}
          </p>

          <div className="flex items-center gap-4 print:hidden">
            <Link href="/legal/privacy-policy">{t('privacy_policy')}</Link>

            {menus?.footer?.map((el) => (
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
