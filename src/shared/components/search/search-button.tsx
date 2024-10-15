import { useTranslation } from 'next-i18next';
import { Button } from '../ui/button';

export function SearchButton() {
  const { t } = useTranslation('common');

  return <Button type="submit">{t('call_to_action.search')}</Button>;
}
