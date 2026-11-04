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

export function MapLegend({ showUserLocation }: { showUserLocation: boolean }) {
  const { t } = useTranslation('page-search');

  return (
    <ul
      aria-label={t('map_legend_label', { defaultValue: 'Map legend' })}
      className="bg-card/95 text-card-foreground pointer-events-none absolute bottom-2 left-2 flex flex-col gap-1 rounded-md border px-2 py-1.5 text-xs shadow-sm print:hidden"
    >
      <li className="flex items-center gap-1.5">
        <LegendPin className="text-primary" />
        {t('map_legend_list', { defaultValue: 'In the list' })}
      </li>
      {showUserLocation && (
        <li className="flex items-center gap-1.5">
          <LegendPin className="text-yellow-500" />
          {t('map_legend_user', { defaultValue: 'Your location' })}
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <span className="flex w-[11px] justify-center">
          <span className="bg-primary/70 size-2 rounded-full ring-1 ring-white" />
        </span>
        {t('map_legend_other', { defaultValue: 'Other locations' })}
      </li>
    </ul>
  );
}
