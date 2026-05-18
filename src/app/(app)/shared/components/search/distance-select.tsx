'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../../hooks/use-app-config';
import {
  DISTANCE_SELECT_CONTENT_ID,
  DISTANCE_SELECT_TRIGGER_ID,
} from '../../lib/aria-constants';
import { persistSearchDistancePreference } from '../../lib/search-distance-preference';
import { cn } from '../../lib/utils';
import {
  searchAtom,
  searchCoordinatesAtom,
  searchDistanceAtom,
} from '../../store/search';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface DistanceSelectProps {
  className?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export function DistanceSelect({
  className = '',
  disabled = false,
  onValueChange,
}: DistanceSelectProps) {
  const { t } = useTranslation('common');

  const appConfig = useAppConfig();
  const setSearch = useSetAtom(searchAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const distance = useAtomValue(searchDistanceAtom);
  const radiusOptions = useMemo(() => {
    const configuredRadiusOptions =
      appConfig?.search?.radiusOptions
        ?.map((option) => option.value)
        .filter((value): value is number => typeof value === 'number') ?? [];

    return configuredRadiusOptions.length > 0
      ? configuredRadiusOptions
      : [15, 30, 45];
  }, [appConfig?.search?.radiusOptions]);

  const hasLocation = coords?.length == 2;

  const setDistance = (value: string) => {
    persistSearchDistancePreference(value);

    setSearch((prev) => ({
      ...prev,
      searchDistance: value,
    }));

    onValueChange?.(value);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        a11yLabel={
          <Label
            htmlFor={DISTANCE_SELECT_TRIGGER_ID}
            className="text-sm font-medium"
          >
            {t('search.radius_placeholder')}:
          </Label>
        }
        contentId={DISTANCE_SELECT_CONTENT_ID}
        disabled={!hasLocation || disabled}
        onValueChange={setDistance}
        value={distance}
      >
        <SelectTrigger id={DISTANCE_SELECT_TRIGGER_ID} className="w-[125px]">
          <SelectValue placeholder={t('search.radius_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="0">{t('search.any')}</SelectItem>
            {radiusOptions.map((radius) => (
              <SelectItem key={radius} value={radius.toString()}>
                {`${radius} ${t('search.miles')}`}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
