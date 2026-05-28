'use client';

import { useAtomValue } from 'jotai';
import { SearchIcon } from 'lucide-react';
import {
  MutableRefObject,
  Ref,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../../../hooks/use-app-config';
import { SEARCH_DIALOG_ID } from '../../../lib/constants';
import { cn } from '../../../lib/utils';
import { searchLocationAtom, searchTermAtom } from '../../../store/search';
import { Button } from '../../ui/button';
import {
  AddMyLocationButton,
  AddMyLocationButtonProps,
} from '../add-my-location-button';
import { SearchDialog, SearchDialogProps } from '../search-dialog';
import { MainSearchLayoutContextProvider } from './main-search-layout-context';

interface MainSearchLayoutProps {
  addMyLocationButtonVariant?: AddMyLocationButtonProps['variant'];
  className?: string;
  searchTriggerRef?: Ref<HTMLButtonElement>;
}

export function MainSearchLayout({
  addMyLocationButtonVariant,
  className = '',
  searchTriggerRef: externalSearchTriggerRef,
}: MainSearchLayoutProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation();

  const searchLocation = useAtomValue(searchLocationAtom);
  const searchTerm = useAtomValue(searchTermAtom);

  const [dialogOpened, setDialogOpened] = useState(false);
  const [focusByDefault, setFocusByDefault] =
    useState<SearchDialogProps['focusByDefault']>('search');
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const addMyLocationButtonRef = useRef<HTMLButtonElement | null>(null);

  const setSearchTriggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      searchTriggerRef.current = element;

      if (!externalSearchTriggerRef) {
        return;
      }

      if (typeof externalSearchTriggerRef === 'function') {
        externalSearchTriggerRef(element);
        return;
      }

      (
        externalSearchTriggerRef as MutableRefObject<HTMLButtonElement | null>
      ).current = element;
    },
    [externalSearchTriggerRef],
  );

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
            ref={setSearchTriggerRef}
            type="button"
            variant="outline"
            aria-controls={SEARCH_DIALOG_ID}
            aria-haspopup="dialog"
            aria-label={t('search.open_search_dialog')}
            data-testid="search-trigger"
            onClick={() => openSearchDialog('search')}
            className={cn(
              'search-box flex h-auto min-h-10 w-full justify-start rounded-lg border-[#00000080] bg-white py-2 pr-3 pl-[2.7rem] text-left text-xs font-normal shadow-sm hover:bg-white',
            )}
          >
            <span
              className={cn(
                'block break-words whitespace-normal',
                searchTerm.trim().length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {searchTriggerText}
            </span>
          </Button>
          <SearchIcon
            className="text-primary absolute top-2 left-[15px] size-6"
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
