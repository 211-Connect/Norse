'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTopLoader } from 'nextjs-toploader';

import { DistanceSelect } from '@/app/(app)/shared/components/search/distance-select';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { useSearchResults } from '../context/search-results-context';
import { radiusHref, showsRadiusSelect } from '../utils/radius';

/** v2 results: the tenant's radius list (Payload radiusSelectValues), on address searches only. */
export function RadiusSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { start } = useTopLoader();
  const appConfig = useAppConfig();
  const { region, hasSearchCoordinates } = useSearchResults();

  if (
    !showsRadiusSelect({
      radiusValues: appConfig.search.radiusOptions,
      hasCoordinates: hasSearchCoordinates,
      region,
    })
  ) {
    return null;
  }
  return (
    <div data-testid="radius-select">
      <DistanceSelect
        onValueChange={(value) => {
          start();
          router.push(radiusHref(pathname, searchParams, value));
        }}
      />
    </div>
  );
}
