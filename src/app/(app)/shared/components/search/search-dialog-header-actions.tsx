'use client';

import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
import { SearchButton } from './search-button';

type SearchDialogHeaderActionsProps = {
  clarifyVisible: boolean;
  disableSearchControls: boolean;
  isMainSearchLoading: boolean;
  isSkipLoading: boolean;
  isConfirmLoading: boolean;
  onClose: () => void;
  onSkipClarify: () => void;
  onConfirmClarify: () => void;
};

export function SearchDialogHeaderActions({
  clarifyVisible,
  disableSearchControls,
  isMainSearchLoading,
  isSkipLoading,
  isConfirmLoading,
  onClose,
  onSkipClarify,
  onConfirmClarify,
}: SearchDialogHeaderActionsProps) {
  const { t } = useTranslation('common');

  if (!clarifyVisible) {
    return (
      <>
        <Button
          type="button"
          className="self-start"
          variant="highlight"
          onClick={onClose}
        >
          {t('search.back')}
        </Button>
        <SearchButton loading={isMainSearchLoading} />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="self-start"
        disabled={disableSearchControls}
        onClick={onClose}
      >
        {t('search.back')}
      </Button>

      <div className="ml-auto flex gap-2">
        <Button
          type="button"
          variant="outline"
          loading={isSkipLoading}
          disabled={disableSearchControls}
          onClick={onSkipClarify}
        >
          {t('search.ai_skip')}
        </Button>
        <Button
          type="button"
          loading={isConfirmLoading}
          disabled={disableSearchControls}
          onClick={onConfirmClarify}
        >
          {t('search.ai_confirm')}
        </Button>
      </div>
    </>
  );
}
