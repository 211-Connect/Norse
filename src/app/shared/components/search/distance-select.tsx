'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { setCookie, deleteCookie } from 'cookies-next/client';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useAppConfig } from '../../hooks/use-app-config';
import {
  searchAtom,
  searchCoordinatesAtom,
  searchDistanceAtom,
} from '../../store/search';
import { USER_PREF_DISTANCE } from '../../lib/constants';

export function DistanceSelect() {
  const appConfig = useAppConfig();
  const setSearch = useSetAtom(searchAtom);
  const coords = useAtomValue(searchCoordinatesAtom);
  const distance = useAtomValue(searchDistanceAtom);

  const { t } = useTranslation('common');

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
    <Select
      onValueChange={setDistance}
      value={distance}
      disabled={!hasLocation}
    >
      <SelectTrigger
        className="w-[125px] rounded-none border-none shadow-none"
        aria-label={t('search.radius_placeholder', {
          defaultValue: 'radius',
        })}
      >
        <SelectValue
          placeholder={t('search.radius_placeholder', {
            defaultValue: 'radius',
          })}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            {t('search.radius_placeholder', {
              defaultValue: 'radius',
            })}
          </SelectLabel>
          <SelectItem value="0">{t('search.any')}</SelectItem>
          {(appConfig?.search?.radiusOptions?.length ?? 0) > 0 ? (
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
  );
}
