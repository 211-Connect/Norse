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
        'bg-primary/5 flex min-h-screen flex-col',
        newLayoutEnabled && 'bg-white',
      )}
    >
      {children}
    </div>
  );
}
