'use client';

import { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { setCookie, deleteCookie } from 'cookies-next/client';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { useAppConfig } from '../../hooks/use-app-config';
import {
  searchAtom,
  searchCoordinatesAtom,
  searchDistanceAtom,
} from '../../store/search';
import {
  DISTANCE_SELECT_CONTENT_ID,
  DISTANCE_SELECT_TRIGGER_ID,
} from '../../lib/aria-constants';
import { USER_PREF_DISTANCE } from '../../lib/constants';
import { cn } from '../../lib/utils';

export interface DistanceSelectProps {
  className?: string;
}

export function DistanceSelect({ className = '' }: DistanceSelectProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const appConfig = useAppConfig();
  const setSearch = useSetAtom(searchAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const distance = useAtomValue(searchDistanceAtom);

  const hasLocation = coords?.length == 2;

  const setDistance = (value) => {
    if (value === '0') {
      deleteCookie(USER_PREF_DISTANCE, { path: '/' });
    } else {
      setCookie(USER_PREF_DISTANCE, value, { path: '/' });
    }

    setSearch((prev) => ({
      ...prev,
      searchDistance: value,
    }));
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Label htmlFor={DISTANCE_SELECT_TRIGGER_ID} className="text-sm font-medium">
        {t('search.radius_placeholder')}:
      </Label>
      {!open && (
        <div
          id={DISTANCE_SELECT_CONTENT_ID}
          role="listbox"
          hidden
          aria-hidden="true"
        />
      )}
      <Select
        contentId={DISTANCE_SELECT_CONTENT_ID}
        onValueChange={setDistance}
        value={distance}
        disabled={!hasLocation}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger
          id={DISTANCE_SELECT_TRIGGER_ID}
          className="w-[125px]"
        >
          <SelectValue placeholder={t('search.radius_placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="0">{t('search.any')}</SelectItem>
            {appConfig?.search?.radiusOptions?.length > 0 ? (
              appConfig?.search?.radiusOptions?.map((el: any) => (
                <SelectItem
                  key={el.value.toString()}
                  value={el.value.toString()}
                >{`${el.value} ${t('search.miles')}`}</SelectItem>
              ))
            ) : (
              <>
                <SelectItem value="15">{`15 ${t('search.miles')}`}</SelectItem>
                <SelectItem value="30">{`30 ${t('search.miles')}`}</SelectItem>
                <SelectItem value="45">{`45 ${t('search.miles')}`}</SelectItem>
              </>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
