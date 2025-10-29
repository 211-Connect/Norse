import { cn } from '@/app/(app)/shared/lib/utils';
import { getAppConfigWithoutHost } from '../../shared/utils/appConfig';

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const newLayoutEnabled = appConfig?.newLayout?.enabled;

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-primary/5',
        newLayoutEnabled && 'bg-white',
      )}
    >
      {children}
    </div>
  );
}
