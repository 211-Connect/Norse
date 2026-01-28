import { cn } from '../lib/utils';
import { Badge, type BadgeProps } from './ui/badge';

interface BadgesProps {
  items: BadgeProps[];
  className?: string;
}

export function Badges({ items, className = '' }: BadgesProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item, index) => (
        <Badge {...item} key={`badge-${index}-${item.label}`} />
      ))}
    </div>
  );
}
