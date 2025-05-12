import { Button } from '../ui/button';
import { useTranslations } from 'next-intl';

export function SearchButton() {
  const t = useTranslations('common');

  return <Button type="submit">{t('call_to_action.search')}</Button>;
}
