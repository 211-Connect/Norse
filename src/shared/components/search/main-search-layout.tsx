import { SearchIcon } from 'lucide-react';
import { use, useCallback, useState } from 'react';
import { Input } from '../ui/input';
import { useTranslation } from 'next-i18next';
import { SearchDialog, SearchDialogProps } from './search-dialog';
import { useAtomValue } from 'jotai';
import { searchLocationAtom, searchTermAtom } from '@/shared/store/search';
import { cn } from '@/shared/lib/utils';
import {
  AddMyLocationButton,
  AddMyLocationButtonProps,
} from './add-my-location-button';

interface MainSearchLayoutProps {
  addMyLocationButtonVariant?: AddMyLocationButtonProps['variant'];
  className?: string;
}

export function MainSearchLayout({
  addMyLocationButtonVariant,
  className = '',
}: MainSearchLayoutProps) {
  const { t } = useTranslation('dynamic');

  const searchLocation = useAtomValue(searchLocationAtom);
  const searchTerm = useAtomValue(searchTermAtom);

  const [dialogOpened, setDialogOpened] = useState(false);
  const [focusByDefault, setFocusByDefault] =
    useState<SearchDialogProps['focusByDefault']>('search');

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setDialogOpened(true);
    }
  }, []);

  const openSearchDialog = useCallback(
    (location: SearchDialogProps['focusByDefault']) => {
      setFocusByDefault(location);
      setDialogOpened(true);
    },
    [],
  );

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <div className={cn('relative w-full', className)}>
          <Input
            onClick={() => openSearchDialog('search')}
            onKeyDown={handleKeyDown}
            readOnly
            className="search-box h-10 rounded-lg border-[#00000080] bg-white pl-[44px] focus:border-primary"
            placeholder={t('search.query_placeholder') || ''}
            value={searchTerm}
          />
          <SearchIcon className="absolute left-[15px] top-2 size-6 text-primary" />
        </div>
        <AddMyLocationButton
          variant={addMyLocationButtonVariant}
          location={searchLocation}
          onClick={() => openSearchDialog('location')}
        />
      </div>
      <SearchDialog
        focusByDefault={focusByDefault}
        open={dialogOpened}
        setOpen={setDialogOpened}
      />
    </>
  );
}
