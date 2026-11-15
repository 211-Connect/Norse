'use client';

import { useAtomValue } from 'jotai';
import { Phone } from 'lucide-react';

import { DialButton } from '../../../features/search/components/no-dial';
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-2xl font-semibold">
          What do you need help with?
        </label>
        <SearchCrisisButton />
      </div>
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

/** Prototype: one obvious crisis entry, beside the first question. */
export function SearchCrisisButton() {
  return (
    <DialButton
      number="988"
      className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-red-700 px-3 text-sm font-semibold text-white no-underline"
    >
      <Phone className="size-4" aria-hidden="true" />
      I&apos;m in a crisis: call 988
    </DialButton>
  );
}
