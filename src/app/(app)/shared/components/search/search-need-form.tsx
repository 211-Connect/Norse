'use client';

import { useAtomValue } from 'jotai';
import { ArrowUp, Heart, House } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../lib/utils';
import { searchTermAtom } from '../../store/search';
import { useMainSearchLayoutContext } from './main-search-layout/main-search-layout-context';

const WHO_OPTIONS = ['Myself', 'Someone else', "I'm a provider"];

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
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-lg font-semibold">
        What do you need help with?
      </label>
      <p className="text-muted-foreground text-sm">
        Tell us what is going on in your own words. Share as much as you like.
      </p>
      <div className="relative mt-2">
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
          className="border-control-border focus-visible:ring-primary w-full resize-none rounded-lg border bg-white p-3 pr-14 text-base shadow-sm outline-none focus-visible:ring-2"
          data-testid="search-need-input"
        />
        <button
          type="submit"
          aria-label="Search"
          className="bg-primary text-primary-foreground absolute right-3 bottom-4 flex size-9 cursor-pointer items-center justify-center rounded-full"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Prototype: the "who is this for" choice. Not sent to search yet. */
export function SearchWhoFor() {
  const [who, setWho] = useState('Myself');

  return (
    <fieldset className="mt-4 flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">
        Who is this search for?
      </legend>
      <div className="flex flex-wrap gap-2">
        {WHO_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={who === option}
            onClick={() => setWho(option)}
            className={cn(
              'cursor-pointer rounded-lg border-2 px-3 py-2 text-sm transition-colors',
              who === option
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Prototype: always-visible safety entries. */
export function SearchSafetyLinks() {
  const rows = [
    {
      Icon: House,
      title: "I'm not safe",
      text: 'Someone is hurting me or I am afraid at home',
      href: 'tel:18007997233',
    },
    {
      Icon: Heart,
      title: "I'm in crisis right now",
      text: 'I need someone to talk to now',
      href: 'tel:988',
    },
  ];

  return (
    <div className="mt-6 flex flex-col gap-2">
      {rows.map(({ Icon, title, text, href }) => (
        <a
          key={title}
          href={href}
          className="border-border hover:border-primary/50 flex items-center gap-3 rounded-lg border-2 p-3"
        >
          <Icon className="text-primary size-6 shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="text-muted-foreground block text-xs">{text}</span>
          </span>
        </a>
      ))}
      <p className="text-muted-foreground text-xs">
        If you are in danger right now, call 911.
      </p>
    </div>
  );
}
