'use client';

import { AlertCircle } from 'lucide-react';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { Alert as AlertComponent } from '@/app/(app)/shared/components/ui/alert';
import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';

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

  if (!appConfig.alert?.text) {
    return null;
  }

  const variant = appConfig?.alert?.variant || 'destructive';

  return (
    <div
      className={`flex items-center justify-center p-2 ${itemsDirection === 'col' ? 'lg:p-4' : 'lg:p-8'}`}
    >
      <AlertComponent variant={variant} className="flex w-auto">
        <div
          className={cn(
            'flex items-center justify-center gap-4',
            getDirectionClass(itemsDirection),
          )}
        >
          <AlertCircle className="size-8 shrink-0" aria-hidden="true" />

          <p className="text-lg font-semibold">{appConfig.alert.text}</p>

          {appConfig.alert?.buttonText != null &&
            appConfig.alert?.url != null && (
              <LocalizedLink
                className={cn(buttonVariants({ variant }))}
                href={appConfig.alert.url}
                target={appConfig.alert.target}
              >
                {appConfig.alert.buttonText}
              </LocalizedLink>
            )}
        </div>
      </AlertComponent>
    </div>
  );
}
