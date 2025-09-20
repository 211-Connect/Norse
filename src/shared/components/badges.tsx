import { MapIcon } from 'lucide-react';

import { Badge } from './ui/badge';

interface BadgesProps {
  items: string[];
}

export function Badges({ items }: BadgesProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge className="flex gap-1" key={item} variant="primary">
          {item}
          <MapIcon className="size-4" />
        </Badge>
      ))}
    </div>
  );
}
