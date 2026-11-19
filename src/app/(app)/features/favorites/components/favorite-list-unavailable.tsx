'use client';

import { LogIn } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Link } from '@/app/(app)/shared/components/link';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/app/(app)/shared/components/ui/card';
import { cn } from '@/app/(app)/shared/lib/utils';
import { getImageUrl } from '@/app/(app)/shared/utils/getImageUrl';

/**
 * Shown when a shared favorites list can't be opened: the API answers the
 * same way for a private list the viewer doesn't own and a deleted one, so
 * the copy covers both and tells owners and recipients what to check.
 */
export function FavoriteListUnavailable({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  const { t } = useTranslation('page-list');
  const pathname = usePathname();
  const signInHref = `/auth/signin?redirect=${encodeURIComponent(pathname || '/favorites')}`;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-xl" data-testid="favorite-list-unavailable">
        <CardContent className="flex items-center justify-center p-2">
          <Image
            src={getImageUrl('undraw_no_data.svg')}
            alt=""
            height={150}
            width={0}
            style={{ height: '150px', width: 'auto' }}
          />
        </CardContent>
        <CardHeader className="gap-3 text-center">
          <h1 className="text-xl leading-none font-semibold tracking-tight">
            {t('unavailable.title')}
          </h1>
          <CardDescription>{t('unavailable.description')}</CardDescription>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-left text-sm">
            <li>
              {isSignedIn
                ? t('unavailable.hint_owner_signed_in')
                : t('unavailable.hint_owner')}
            </li>
            <li>{t('unavailable.hint_shared')}</li>
          </ul>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {!isSignedIn ? (
              <Link
                href={signInHref}
                className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
              >
                <LogIn className="size-4" aria-hidden="true" />
                {t('unavailable.sign_in')}
              </Link>
            ) : null}
            <Link
              href="/"
              className={buttonVariants({
                variant: isSignedIn ? 'default' : 'outline',
              })}
            >
              {t('back_to_home')}
            </Link>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
