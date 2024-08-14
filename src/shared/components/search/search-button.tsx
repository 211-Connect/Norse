import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { SearchService } from '../../services/search-service';
import { useAtomValue } from 'jotai';
import { searchAtom } from '../../store/search';

export function SearchButton() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const search = useAtomValue(searchAtom);

  const onClick = async () => {
    const urlParams = SearchService.createUrlParamsForSearch(search);

    await router.push({
      pathname: '/search',
      query: urlParams,
    });
  };

  return <Button onClick={onClick}>{t('call_to_action.search')}</Button>;
}
