import { SearchIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Input } from '../ui/input';
import { useTranslation } from 'next-i18next';
import { SearchDialog } from './search-dialog';
import { useAtomValue } from 'jotai';
import { searchTermAtom } from '@/shared/store/search';
import { cn } from '@/shared/lib/utils';

export function MainSearchLayout({ className = '' }: { className?: string }) {
  const { t } = useTranslation('dynamic');

  const searchTerm = useAtomValue(searchTermAtom);

  const [dialogOpened, setDialogOpened] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setDialogOpened(true);
    }
  }, []);

  return (
    <>
      <div className={cn('relative', className)}>
        <Input
          onClick={() => setDialogOpened(true)}
          onKeyDown={handleKeyDown}
          readOnly
          className="search-box h-10 rounded-lg border-[#00000080] bg-white pl-[44px] focus:border-primary"
          placeholder={t('search.query_placeholder') || ''}
          value={searchTerm}
        />
        <SearchIcon className="absolute left-[15px] top-2 size-6 text-primary" />
      </div>
      <SearchDialog open={dialogOpened} setOpen={setDialogOpened} />
    </>
  );
}
