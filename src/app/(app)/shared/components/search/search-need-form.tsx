'use client';

import { useAtomValue } from 'jotai';
import { ArrowUp, Phone } from 'lucide-react';

import { useAppConfig } from '../../hooks/use-app-config';
import { searchTermAtom } from '../../store/search';
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
  const appConfig = useAppConfig();

  // Short phrases get suggestions. A sentence gets out of the way.
  const typed = searchTerm.trim().toLowerCase();
  const matches =
    typed && typed.split(/\s+/).length <= 3
      ? [
          ...appConfig.suggestions.map((option) => option.value),
          ...appConfig.topics.list.flatMap((topic) =>
            topic.subtopics.map((subtopic) => subtopic.name),
          ),
        ]
          .filter(
            (value) =>
              value.toLowerCase().includes(typed) &&
              value.toLowerCase() !== typed,
          )
          .slice(0, 5)
      : [];

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
      <label htmlFor={inputId} className="text-2xl font-semibold">
        What do you need help with?
      </label>
      <div className="relative">
        <textarea
          id={inputId}
          autoFocus
          rows={4}
          value={searchTerm}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="For example: I think I will run out of food this week."
          className="border-control-border focus:border-primary block w-full resize-none rounded-lg border bg-white p-3 pr-14 text-base shadow-sm outline-none focus:outline-none focus-visible:outline-none"
          data-testid="search-need-input"
        />
        <button
          type="submit"
          aria-label="Search"
          className="bg-primary text-primary-foreground absolute right-3 bottom-3 flex size-9 cursor-pointer items-center justify-center rounded-lg"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      </div>
      {matches.length > 0 && (
        <ul className="flex flex-col" data-testid="search-need-suggestions">
          {matches.map((value) => (
            <li key={value}>
              <button
                type="button"
                className="text-primary hover:bg-primary/5 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm"
                onClick={() => onChange(value)}
              >
                {value}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Prototype: one obvious crisis entry. */
export function SearchCrisisButton() {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <a
        href="tel:988"
        className="bg-destructive text-destructive-foreground flex items-center justify-center gap-2 rounded-lg p-4 text-lg font-semibold no-underline"
      >
        <Phone className="size-5" aria-hidden="true" />
        I&apos;m in a crisis right now
      </a>
      <p className="text-muted-foreground text-center text-xs">
        If you are in danger right now, call 911.
      </p>
    </div>
  );
}
