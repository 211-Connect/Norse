'use client';

import { SearchIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';

import {
  AddMyLocationButton,
  AddMyLocationButtonProps,
} from './add-my-location-button';
import { Input } from '../ui/input';
import { SearchDialog, SearchDialogProps } from './search-dialog';
import { searchLocationAtom, searchTermAtom } from '../../store/search';
import { cn } from '../../lib/utils';
import { useAppConfig } from '../../hooks/use-app-config';

interface MainSearchLayoutProps {
  addMyLocationButtonVariant?: AddMyLocationButtonProps['variant'];
  className?: string;
}

export function MainSearchLayout({
  addMyLocationButtonVariant,
  className = '',
}: MainSearchLayoutProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

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
            placeholder={
              appConfig.search.texts?.queryInputPlaceholder ||
              t('search.query_placeholder', { ns: 'common' })
            }
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
