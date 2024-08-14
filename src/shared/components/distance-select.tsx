import { useTranslation } from 'next-i18next';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAppConfig } from '../hooks/use-app-config';
import { useSetAtom } from 'jotai';
import { searchAtom } from '../store/search';
import { setCookie } from 'nookies';
import { USER_PREF_DISTANCE } from '../lib/constants';

export function DistanceSelect() {
  const { t } = useTranslation();
  const appConfig = useAppConfig();
  const setSearch = useSetAtom(searchAtom);

  const setDistance = (value) => {
    setCookie(null, USER_PREF_DISTANCE, value, { path: '/' });
    setSearch((prev) => ({
      ...prev,
      searchDistance: value,
    }));
  };

  return (
    <Select
      defaultValue={appConfig?.search?.defaultRadius?.toString()}
      onValueChange={setDistance}
    >
      <SelectTrigger className="w-[125px]">
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
          {appConfig?.search?.radiusOptions?.map((el: any) => (
            <SelectItem
              key={el.value.toString()}
              value={el.value.toString()}
            >{`${el.value} ${t('search.miles')}`}</SelectItem>
          )) ?? (
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
