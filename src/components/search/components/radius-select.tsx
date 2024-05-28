import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_PREF_DISTANCE } from '@/constants/cookies';
import { useAppConfig } from '@/hooks/use-app-config';
import { useTranslation } from 'next-i18next';
import { setCookie } from 'nookies';

export default function RadiusSelect({
  name,
  value,
  onValueChange,
}: {
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const appConfig = useAppConfig();

  return (
    <Select
      name={name}
      value={value}
      onValueChange={(value) => {
        onValueChange?.(value);
        setCookie(null, USER_PREF_DISTANCE, value, { path: '/' });
      }}
    >
      <SelectTrigger className="w-[125px]">
        <SelectValue
          placeholder={t('search.radius_placeholder', {
            ns: 'dynamic',
            defaultValue: 'radius',
          })}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            {t('search.radius_placeholder', {
              ns: 'dynamic',
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
