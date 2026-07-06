'use client';

import { AlertCircle } from 'lucide-react';

import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';
import { Alert as AlertComponent } from '@/app/(app)/shared/components/ui/alert';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';

type Direction = 'col' | 'row';

const getDirectionClass = (direction: Direction | undefined): string => {
  if (direction === 'col') {
    return 'flex-col';
  }

  if (direction === 'row') {
    return 'flex-row';
  }

  return 'flex-col sm:flex-row';
};

type AlertProps = {
  itemsDirection?: 'col' | 'row';
};

export default function Alert({ itemsDirection }: AlertProps) {
  const appConfig = useAppConfig();
  const alerts = appConfig.alerts ?? [];

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-2',
        itemsDirection === 'col' ? 'lg:p-4' : 'lg:p-8',
        'space-y-3',
      )}
    >
      {alerts.map((alert, index) => {
        const variant = alert.variant || 'destructive';

        return (
          <div
            key={`${alert.text}-${alert.url ?? ''}-${index}`}
            className="flex items-center justify-center"
          >
            <AlertComponent variant={variant} className="flex w-auto">
              <div
                className={cn(
                  'flex items-center justify-center gap-4',
                  getDirectionClass(itemsDirection),
                )}
              >
                <AlertCircle className="size-8 shrink-0" aria-hidden="true" />

                <p className="text-lg font-semibold">{alert.text}</p>

                {alert.buttonText != null && alert.url != null && (
                  <LocalizedLink
                    className={cn(buttonVariants({ variant }))}
                    href={alert.url}
                    target={alert.target}
                  >
                    {alert.buttonText}
                  </LocalizedLink>
                )}
              </div>
            </AlertComponent>
          </div>
        );
      })}
    </div>
  );
}
