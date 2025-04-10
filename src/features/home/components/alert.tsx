'use client';
import Link from 'next/link';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';
import { Alert as AlertComponent } from '@/shared/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useConfigStore } from '@/lib/context/config-context/config-store-provider';

export default function Alert() {
  const alert = useConfigStore((config) => config.alert);

  if (alert == null || Object.keys(alert).length === 0) return null;

  return (
    <div className="flex items-center justify-center p-8">
      <AlertComponent variant="destructive" className="flex w-auto">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AlertCircle className="size-8" />

          <p className="text-lg font-semibold">{alert.text}</p>

          {alert?.buttonText != null && alert?.href != null && (
            <Link
              className={cn(buttonVariants({ variant: 'destructive' }))}
              href={alert.href}
            >
              {alert.buttonText}
            </Link>
          )}
        </div>
      </AlertComponent>
    </div>
  );
}
