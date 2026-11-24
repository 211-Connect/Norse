'use client';

import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  buttonVariants,
} from '@/app/(app)/shared/components/ui/button';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';

import { DialButton } from './dial-button';

/**
 * Shown instead of the result cards when the v2 call failed. It never shows the v1 cards or a
 * "no results" card: the person did not get an answer, so the card says so and offers a retry.
 */
export function V2ErrorCard({
  onRetry,
  busy,
}: {
  onRetry: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation('page-search');
  const contactNumber = useAppConfig()?.contact?.number;
  return (
    <Card role="alert" data-testid="v2-search-error">
      <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
        <p className="font-semibold">
          {t('v2_error_title', 'We could not load your results.')}
        </p>
        <Button
          type="button"
          className="min-h-11 px-5"
          disabled={busy}
          aria-busy={busy}
          data-testid="v2-search-retry"
          onClick={onRetry}
        >
          {t('v2_error_retry', 'Try again')}
        </Button>
        {contactNumber && (
          <DialButton
            number={contactNumber}
            testId="v2-error-call"
            className={cn(buttonVariants({ size: 'sm' }), 'min-h-11 gap-1')}
          >
            <Phone className="size-4" aria-hidden="true" /> {contactNumber}
          </DialButton>
        )}
      </CardContent>
    </Card>
  );
}
