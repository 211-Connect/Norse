'use client';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useAppConfig } from '@/lib/context/app-config-context';
import { cn } from '@/lib/cn-utils';
import { buttonVariants } from '@/components/ui/button';
import { Alert as AlertComponent } from '@/components/ui/alert';

export default function Alert() {
  const appConfig = useAppConfig();

  if (appConfig.alert == null || Object.keys(appConfig.alert).length === 0)
    return null;

  return (
    <div className="flex items-center justify-center p-8">
      <AlertComponent
        variant="destructive"
        className="flex w-auto border-red-500 bg-red-50"
      >
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AlertCircle className="size-8 text-red-600" />

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
    </div>
  );
}
