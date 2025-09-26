import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../ui/input';
import { useTranslation } from 'next-i18next';
import { SearchDialog } from './search-dialog';
import { useAtomValue } from 'jotai';
import { searchTermAtom } from '@/shared/store/search';

export function MainSearchLayout() {
  const { t } = useTranslation('dynamic');

  const searchTerm = useAtomValue(searchTermAtom);

  const [dialogOpened, setDialogOpened] = useState(false);

  return (
    <>
      <div className="relative">
        <Input
          onClick={() => setDialogOpened(true)}
          className="h-10 rounded-lg border-[#00000080] bg-white pl-[44px]"
          placeholder={t('search.query_placeholder') || ''}
          value={searchTerm}
        />
        <SearchIcon className="absolute left-[15px] top-2 size-6 text-primary" />
      </div>
      <SearchDialog open={dialogOpened} setOpen={setDialogOpened} />
    </>
  );
}
