import { Card, CardContent } from '@/shared/components/ui/card';
import { Badges } from '@/shared/components/badges';
import { ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';

interface MapPopupProps {
  id: string;
  name: string;
  linkText: string;
  address?: string;
  distance?: string;
  labels?: string[];
}

export function MapPopup({
  distance,
  id,
  linkText,
  name,
  address,
  labels = [],
}: MapPopupProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {labels.length > 0 && <Badges items={labels} />}
        <p className="text-sm font-medium">{name}</p>
        {address && (
          <div className="flex flex-col gap-[10px]">
            <div className="flex gap-[6px]">
              <MapPin className="mt-[2px] size-4 text-primary" />
              <p className="flex-1 text-sm">{address}</p>
            </div>
            {distance && <p className="text-sm">{distance}</p>}
          </div>
        )}
        <Link
          href={`/search/${id}`}
          className="py-[5px] text-center text-sm font-medium text-primary hover:underline"
        >
          {linkText}
          <ChevronRight className="ml-1 inline-block size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
