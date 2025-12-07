'use client';

import { AlertCircle } from 'lucide-react';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { Alert as AlertComponent } from '@/app/(app)/shared/components/ui/alert';
import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';

export default function Alert() {
  const appConfig = useAppConfig();

  if (!appConfig?.alert || Object.keys(appConfig.alert).length === 0)
    return null;

  const variant = appConfig?.alert?.variant || 'destructive';

  return (
    <div className="flex items-center justify-center p-8">
      <AlertComponent variant={variant} className="flex w-auto">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AlertCircle className="size-8" />

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
