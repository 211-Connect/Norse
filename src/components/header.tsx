'use client';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn-utils';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { HEADER_ID } from '@/lib/constants';
import { Button } from './ui/button';

type Props = {
  fullWidth?: boolean;
};

export function Header(props: Props) {
  const appConfig = useAppConfig();
  const t = useTranslations('common');

  const handleFeedback = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const currentUrl = new URL(appConfig?.feedbackUrl);
    const feedbackUrl = currentUrl.toString().split('?')[0];
    const urlParams = new URLSearchParams(currentUrl.searchParams);

    if (typeof window !== 'undefined') {
      urlParams.set('referring_url', window.location.href);
    }

    window.open(`${feedbackUrl}?${urlParams.toString()}`, '_blank');
  };

  return (
    <header id={HEADER_ID} className="border-b bg-white print:hidden">
      <div
        className={cn(
          props.fullWidth ? '100%' : 'container mx-auto p-4',
          'flex items-center justify-between',
        )}
      >
        <Link href="/">
          <Image
            src={appConfig?.logo?.url ?? '/logo.png'}
            alt="Home"
            width={appConfig?.logo?.width}
            height={appConfig?.logo?.height}
            style={{ height: '3.5rem', maxHeight: '3.5rem', width: 'auto' }}
          />
        </Link>

        <nav className="hidden w-full justify-end lg:flex">
          <ul className="flex items-center gap-4">
            <li>
              <Link href="/">{t('header.home')}</Link>
            </li>

            {appConfig?.headerMenu?.map((item) => (
              <li key={item.name}>
                <Link href={item.href} target={item.target}>
                  {item.name}
                </Link>
              </li>
            ))}

            {appConfig?.feedbackUrl && (
              <li>
                <Button
                  className="feedback"
                  variant="outline"
                  onClick={handleFeedback}
                >
                  {t('header.submit_feedback')}
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
