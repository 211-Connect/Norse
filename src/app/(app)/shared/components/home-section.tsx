import { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { Separator } from './ui/separator';

type HomeSectionProps = {
  title?: string;
  className?: string;
  showSeparator?: boolean;
  children: ReactNode;
};

export function HomeSection({
  title,
  className,
  showSeparator = true,
  children,
}: HomeSectionProps) {
  return (
    <section className={cn('container z-2 mx-auto py-8', className)}>
      {title && (
        <div className="mb-6">
          <h2 className="text-center text-3xl font-bold">{title}</h2>
          {showSeparator && <Separator className="mt-3" />}
        </div>
      )}

      <div>{children}</div>
    </section>
  );
}
