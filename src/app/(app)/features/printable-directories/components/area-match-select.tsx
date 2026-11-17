'use client';

import { type TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import {
  AREA_MATCH_VALUES,
  type AreaMatch,
  isAreaMatch,
} from '@/types/areaSearch';

const SITE_DEFAULT = 'site_default';

const LABELS: Record<AreaMatch, string> = {
  located: 'Located in the area',
  located_or_serving: 'Located in the area, or serving it if not located',
  serving: 'Located in or serving the area',
};

/** A directory's area match as shown to an editor; null is the site default. */
export const areaMatchLabel = (t: TFunction, value: AreaMatch | null) =>
  value
    ? t(`default_query_config.area_match_${value}`, {
        ns: 'page-directories',
        defaultValue: LABELS[value],
      })
    : t('default_query_config.area_match_site_default', {
        ns: 'page-directories',
        defaultValue: 'Site default',
      });

type AreaMatchSelectProps = {
  id: string;
  /** Null: the site's default from the CMS search settings. */
  value: AreaMatch | null;
  onChange: (value: AreaMatch | null) => void;
};

/**
 * Which resources an area default location (state, county, city, ZIP)
 * includes. Shown only with such a location: an address uses the radius.
 * See docs/area-search.md.
 */
export function AreaMatchSelect({ id, value, onChange }: AreaMatchSelectProps) {
  const { t } = useTranslation('page-directories');

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {t('default_query_config.area_match_label', {
          defaultValue: 'Resources in this area',
        })}
      </Label>
      <Select
        value={value ?? SITE_DEFAULT}
        onValueChange={(next) => onChange(isAreaMatch(next) ? next : null)}
      >
        <SelectTrigger id={id} className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SITE_DEFAULT}>
            {areaMatchLabel(t, null)}
          </SelectItem>
          {AREA_MATCH_VALUES.map((match) => (
            <SelectItem key={match} value={match}>
              {areaMatchLabel(t, match)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">
        {t('default_query_config.area_match_help', {
          defaultValue:
            'The location is searched as its whole area, so no radius applies.',
        })}
      </p>
    </div>
  );
}
