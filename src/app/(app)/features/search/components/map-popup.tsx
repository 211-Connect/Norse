import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { Badges } from '@/app/(app)/shared/components/badges';
import { ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/app/(app)/shared/components/link';

interface MapPopupProps {
  id: string;
  name: string;
  address?: string;
  distance?: number;
  labels?: string[];
}

export function MapPopup({
  distance,
  id,
  name,
  address,
  labels = [],
}: MapPopupProps) {
  const { t } = useTranslation('common');
  const badges = labels.map((label) => ({ label }));

  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-3">
        {badges.length > 0 && <Badges items={badges} />}
        <p className="text-sm font-medium">{name}</p>
        {address && (
          <div className="flex flex-col gap-[10px]">
            <div className="flex gap-[6px]">
              <MapPin className="mt-[2px] size-4 text-primary" />
              <p className="flex-1 text-sm">{address}</p>
            </div>
            {distance && (
              <p className="text-sm">{`${distance.toFixed(1)} ${t('search.miles_short', { ns: 'common' })}`}</p>
            )}
          </div>
        )}
        <Link
          href={`/search/${id}`}
          className="py-[5px] text-center text-sm font-medium text-primary hover:underline"
        >
          {t('learn_more', { ns: 'page-search' })}
          <ChevronRight className="ml-1 inline-block size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
