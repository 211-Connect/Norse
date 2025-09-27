import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/lib/utils';

export function LabeledElement({
  Icon,
  IconCustomClasses = '',
  title,
  children,
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-[6px]">
        <Icon className={cn('size-4', IconCustomClasses)} />
        <Label>{title}</Label>
      </div>
      <div className="ml-[22px] text-sm">{children}</div>
    </div>
  );
}
