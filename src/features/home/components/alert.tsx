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

  return (
    <AlertComponent variant="destructive" className="flex w-auto">
      <div className="flex items-center justify-center gap-4">
        <AlertCircle className="size-8" />

        <p className="text-lg font-semibold">{appConfig.alert.text}</p>

        {appConfig.alert?.buttonText != null &&
          appConfig.alert?.url != null && (
            <Link
              className={cn(buttonVariants({ variant: 'destructive' }))}
              href={appConfig.alert.url}
            >
              {appConfig.alert.buttonText}
            </Link>
          )}
      </div>
    </AlertComponent>
  );
}
