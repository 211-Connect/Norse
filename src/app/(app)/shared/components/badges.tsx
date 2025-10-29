import { MapIcon } from 'lucide-react';

import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface BadgesProps {
  items: string[];
  className?: string;
}

export function Badges({ items, className = '' }: BadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {items.map((item) => (
        <Badge className="flex gap-1" key={item} variant="primary">
          {item}
          <MapIcon className="size-4" />
        </Badge>
      ))}
    </div>
  );
}
