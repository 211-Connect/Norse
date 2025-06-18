import Link from 'next/link';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';
import { Alert as AlertComponent } from '@/shared/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Alert() {
  const appConfig = useAppConfig();

  if (appConfig.alert == null || Object.keys(appConfig.alert).length === 0)
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
              <Link
                className={cn(buttonVariants({ variant }))}
                href={appConfig.alert.url}
              >
                {appConfig.alert.buttonText}
              </Link>
            )}
        </div>
      </AlertComponent>
    </div>
  );
}
