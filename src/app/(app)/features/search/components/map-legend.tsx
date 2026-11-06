import { Info, Loader2 } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
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

export type MapLegendRows = {
  /** The map shows a location from the list's current page. */
  inList: boolean;
  /** The map shows a location outside it. */
  other: boolean;
  /** The map shows an address with several resources. */
  site: boolean;
};

const ROW = 'flex items-center gap-1.5';

export function MapLegend({
  rows,
  showUserLocation,
  isLoadingPins,
}: {
  rows: MapLegendRows;
  showUserLocation: boolean;
  /** The rest of the search's circles are on their way: says so as the last row. */
  isLoadingPins: boolean;
}) {
  const { t } = useTranslation('page-search');
  const listId = useId();
  // Below `lg` the map is 320px high, so the legend waits behind a button.
  const [isOpen, setIsOpen] = useState(false);
  const label = t('map_legend_label', { defaultValue: 'Map legend' });

  return (
    <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1 print:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="bg-card/95 text-card-foreground hover:bg-accent focus-visible:ring-ring pointer-events-auto flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      >
        {isLoadingPins ? (
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
        ) : (
          <Info aria-hidden className="size-3.5" />
        )}
        {label}
      </button>
      <ul
        id={listId}
        aria-label={label}
        className={cn(
          'bg-card/95 text-card-foreground flex-col gap-1 rounded-md border px-2 py-1.5 text-xs shadow-sm',
          isOpen ? 'flex' : 'hidden lg:flex',
        )}
      >
        {rows.inList && (
          <li className={ROW}>
            <LegendSymbol>
              <span className="bg-primary size-2.5 rounded-full ring-1 ring-white" />
            </LegendSymbol>
            {t('map_legend_list', { defaultValue: 'In the list' })}
          </li>
        )}
        {rows.other && (
          <li className={ROW}>
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
        )}
        {rows.site && (
          <li className={ROW}>
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
        )}
        {showUserLocation && (
          <li className={ROW}>
            <LegendSymbol>
              <LegendPin className="text-yellow-500" />
            </LegendSymbol>
            {t('map_legend_user', { defaultValue: 'Your location' })}
          </li>
        )}
        {isLoadingPins && (
          <li
            role="status"
            className={cn(
              ROW,
              'text-muted-foreground mt-0.5 border-t pt-1 first:mt-0 first:border-t-0 first:pt-0',
            )}
          >
            <LegendSymbol>
              <Loader2 aria-hidden className="size-3 animate-spin" />
            </LegendSymbol>
            {t('map_pins_loading', { defaultValue: 'Loading all locations…' })}
          </li>
        )}
      </ul>
    </div>
  );
}
