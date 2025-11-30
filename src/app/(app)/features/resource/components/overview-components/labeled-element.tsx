import { Label } from '@/app/(app)/shared/components/ui/label';
import { cn } from '@/app/(app)/shared/lib/utils';

export function LabeledElement({
  Icon,
  IconCustomClasses = '',
  title,
  children,
}) {
  const id = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-[6px]">
        <Icon className={cn('size-4', IconCustomClasses)} />
        <p
          className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          id={id}
        >
          {title}
        </p>
      </div>
      <div className="ml-[22px] text-sm" aria-labelledby={id}>
        {children}
      </div>
    </div>
  );
}
