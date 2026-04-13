'use client';

import { SearchIcon } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';

import {
  AddMyLocationButton,
  AddMyLocationButtonProps,
} from '../add-my-location-button';
import {
  SearchDialog,
  SearchDialogProps,
} from '../search-dialog';
import { searchLocationAtom, searchTermAtom } from '../../../store/search';
import { SEARCH_DIALOG_ID } from '../../../lib/constants';
import { cn } from '../../../lib/utils';
import { useAppConfig } from '../../../hooks/use-app-config';
import { Button } from '../../ui/button';
import { MainSearchLayoutContextProvider } from './main-search-layout-context';

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
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const addMyLocationButtonRef = useRef<HTMLButtonElement>(null);

  const openSearchDialog = useCallback(
    (location: SearchDialogProps['focusByDefault']) => {
      setFocusByDefault(location);
      setDialogOpened(true);
    },
    [],
  );

  const searchTriggerText = useMemo(() => {
    if (searchTerm.trim().length > 0) {
      return searchTerm;
    }

    return (
      appConfig.search.texts?.queryInputPlaceholder ||
      t('search.query_placeholder', { ns: 'common' })
    );
  }, [appConfig.search.texts?.queryInputPlaceholder, searchTerm, t]);

  return (
    <MainSearchLayoutContextProvider>
      <div className="flex w-full flex-col items-start gap-2">
        <div className={cn('relative w-full', className)}>
          <Button
            ref={searchTriggerRef}
            type="button"
            variant="outline"
            aria-controls={SEARCH_DIALOG_ID}
            aria-expanded={dialogOpened}
            aria-haspopup="dialog"
            aria-label={t('search.open_search_dialog', {
              defaultValue: 'Open search dialog',
            })}
            data-testid="search-trigger"
            onClick={() => openSearchDialog('search')}
            className={cn(
              'search-box flex h-auto min-h-10 w-full justify-start rounded-lg border-[#00000080] bg-white py-2 pl-[2.7rem] pr-3 text-left text-xs font-normal shadow-sm',
            )}
          >
            <span
              className={cn(
                'block whitespace-normal break-words',
                searchTerm.trim().length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {searchTriggerText}
            </span>
          </Button>
          <SearchIcon
            className="absolute left-[15px] top-2 size-6 text-primary"
            aria-hidden="true"
          />
        </div>
        <AddMyLocationButton
          buttonRef={addMyLocationButtonRef}
          variant={addMyLocationButtonVariant}
          location={searchLocation}
          onClick={() => openSearchDialog('location')}
        />
      </div>
      <SearchDialog
        focusByDefault={focusByDefault}
        open={dialogOpened}
        setOpen={setDialogOpened}
        restoreFocusElement={
          focusByDefault === 'location'
            ? addMyLocationButtonRef.current
            : searchTriggerRef.current
        }
      />
    </MainSearchLayoutContextProvider>
  );
}
