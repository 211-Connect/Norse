'use client';

import { useAtomValue } from 'jotai';

import { EmergencyLine } from '../../../features/search/components/emergency-line';
import { searchTermAtom } from '../../store/search';
import { NeedBox } from './need-box';
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
  const { setSearch } = useMainSearchLayoutContext();

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
      <EmergencyLine />
      <label htmlFor={inputId} className="text-2xl font-semibold">
        What do you need help with?
      </label>
      <NeedBox
        inputId={inputId}
        value={searchTerm}
        onChange={onChange}
        rows={4}
        autoFocus
        placeholder="For example: I think I will run out of food this week."
        testId="search-need-input"
      />
    </div>
  );
}
