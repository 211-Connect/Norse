'use client';

import { useAtomValue } from 'jotai';

import {
  DEFAULT_HOTLINES,
  EmergencyLine,
} from '../../../features/search/components/emergency-line';
import { useV2Navigate } from '../../../features/search/v2/use-v2-search';
import { suggestionPickChanges } from '../../../features/search/v2/landing';
import { searchTermAtom } from '../../store/search';
import { useAppConfig } from '../../hooks/use-app-config';
import { NeedBox } from './need-box';
import { needBoxTexts } from './need-texts';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

/** Prototype: the need box of the search dialog. */
export function SearchNeedInput({
  inputId,
  onChange: notifyChange,
}: {
  inputId: string;
  onChange?: () => void;
}) {
  const searchTerm = useAtomValue(searchTermAtom);
  const needTexts = needBoxTexts(useAppConfig().search.texts);
  const { setSearch } = useMainSearchLayoutContext();
  const { toResults } = useV2Navigate();

  const onChange = (value: string) => {
    notifyChange?.();
    setSearch((prev) => ({
      ...prev,
      query: value,
      queryType: 'text',
      organizationId: '',
      href: '',
      target: '',
      searchTerm: value,
      queryLabel: value,
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <EmergencyLine hotlines={DEFAULT_HOTLINES} />
      <label htmlFor={inputId} className="text-2xl font-semibold">
        {needTexts.title}
      </label>
      <NeedBox
        inputId={inputId}
        value={searchTerm}
        onChange={onChange}
        rows={4}
        autoFocus
        placeholder={needTexts.placeholder}
        onPick={(option) => toResults(suggestionPickChanges(option))}
        testId="search-need-input"
      />
    </div>
  );
}
