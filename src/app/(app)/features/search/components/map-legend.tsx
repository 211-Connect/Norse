import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/(app)/shared/lib/utils';

function LegendPin({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 27 41"
      className={cn('h-4 w-[11px] shrink-0', className)}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M13.5 0C6 0 0 6 0 13.5 0 23.5 13.5 41 13.5 41S27 23.5 27 13.5C27 6 21 0 13.5 0Z"
      />
      <circle cx="13.5" cy="13.5" r="5" fill="#fff" />
    </svg>
  );
}

const SUBTLE_DOT = 'bg-[color-mix(in_srgb,hsl(var(--primary))_50%,white)]';

/** Wide enough for the numbered dot, so every label starts at the same place. */
function LegendSymbol({ children }: { children: ReactNode }) {
  return <span className="flex w-4 shrink-0 justify-center">{children}</span>;
}

export function MapLegend({
  showUserLocation,
  isLoadingPins,
}: {
  showUserLocation: boolean;
  /** The rest of the search's circles are on their way: says so as the last row. */
  isLoadingPins: boolean;
}) {
  const { t } = useTranslation('page-search');

  return (
    <ul
      aria-label={t('map_legend_label', { defaultValue: 'Map legend' })}
      className="bg-card/95 text-card-foreground pointer-events-none absolute top-2 left-2 flex flex-col gap-1 rounded-md border px-2 py-1.5 text-xs shadow-sm print:hidden"
    >
      <li className="flex items-center gap-1.5">
        <LegendSymbol>
          <span className="bg-primary size-2.5 rounded-full ring-1 ring-white" />
        </LegendSymbol>
        {t('map_legend_list', { defaultValue: 'In the list' })}
      </li>
      <li className="flex items-center gap-1.5">
        <LegendSymbol>
          <span
            className={cn(
              'size-2.5 rounded-full ring-1 ring-white',
              SUBTLE_DOT,
            )}
          />
        </LegendSymbol>
        {t('map_legend_other', { defaultValue: 'Other locations' })}
      </li>
      <li className="flex items-center gap-1.5">
        <LegendSymbol>
          <span
            className={cn(
              'flex size-4 items-center justify-center rounded-full text-[9px] leading-none font-medium text-white ring-1 ring-white',
              SUBTLE_DOT,
            )}
          >
            2
          </span>
        </LegendSymbol>
        {t('map_legend_site', {
          defaultValue: 'Resources at one address (zoom in)',
        })}
      </li>
      {showUserLocation && (
        <li className="flex items-center gap-1.5">
          <LegendSymbol>
            <LegendPin className="text-yellow-500" />
          </LegendSymbol>
          {t('map_legend_user', { defaultValue: 'Your location' })}
        </li>
      )}
      {isLoadingPins && (
        <li
          role="status"
          className="text-muted-foreground mt-0.5 flex items-center gap-1.5 border-t pt-1"
        >
          <LegendSymbol>
            <Loader2 aria-hidden className="size-3 animate-spin" />
          </LegendSymbol>
          {t('map_pins_loading', { defaultValue: 'Loading all locations…' })}
        </li>
      )}
    </ul>
  );
}
