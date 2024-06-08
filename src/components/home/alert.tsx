import { useAppConfig } from '@/hooks/use-app-config';
import Link from 'next/link';
import { buttonVariants } from '../ui/button';

export default function Alert() {
  const appConfig = useAppConfig();

  if (appConfig.alert == null || Object.keys(appConfig.alert).length === 0)
    return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 bg-red-600 p-4 text-center text-white sm:flex-row sm:text-left">
      <p>{appConfig.alert.text}</p>

      {appConfig.alert?.buttonText != null && appConfig.alert?.url != null && (
        <Link
          className={buttonVariants({ variant: 'default' })}
          href={appConfig.alert.url}
        >
          {appConfig.alert.buttonText}
        </Link>
      )}
    </div>
  );
}
