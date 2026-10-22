'use client';

import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { Loader2Icon } from 'lucide-react';
import { CSSProperties, Fragment, MouseEvent, Ref } from 'react';

import { cn } from '@/app/(app)/shared/lib/utils';

import { useAppConfig } from '../../../hooks/use-app-config';
import { Badge } from '../badge';
import { SELECT_INTERACTIVE_ACTIVE_CLASSNAME } from '../select';
import { Separator } from '../separator';
import {
  AutocompleteOption,
  AutocompleteOptionGroup,
  IndexedAutocompleteOption,
} from './types';

type AutocompleteListboxProps = {
  id: string;
  ref: Ref<HTMLDivElement>;
  groups: AutocompleteOptionGroup[];
  activeIndex: number;
  /** Text whose matches are emphasized in each option. */
  highlightText: string;
  optionId: (index: number) => string;
  /** Adds a "loading" row while the list has no options yet. */
  loading: boolean;
  loadingLabel: string;
  className?: string;
  style?: CSSProperties;
  onListPointerDown: () => void;
  onListMouseLeave: () => void;
  onOptionMouseDown: (event: MouseEvent, option: AutocompleteOption) => void;
  onOptionMouseMove: (index: number) => void;
};

/** The open suggestion list. Purely presentational: all state lives in
 *  `useAutocomplete`. */
export function AutocompleteListbox({
  id,
  ref,
  groups,
  activeIndex,
  highlightText,
  optionId,
  loading,
  loadingLabel,
  className,
  style,
  onListPointerDown,
  onListMouseLeave,
  onOptionMouseDown,
  onOptionMouseMove,
}: AutocompleteListboxProps) {
  return (
    <div
      id={id}
      ref={ref}
      role="listbox"
      data-testid="autocomplete-listbox"
      aria-multiselectable="false"
      className={cn(
        'animate-opacity-in z-10 mt-2 overflow-auto overscroll-contain bg-white',
        className,
      )}
      style={style}
      onTouchStart={onListPointerDown}
      onMouseDown={onListPointerDown}
      onMouseLeave={onListMouseLeave}
    >
      {loading && groups.length === 0 && (
        // Announced through the combobox's status region instead.
        <div
          className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-xs"
          aria-hidden="true"
        >
          <Loader2Icon className="size-4 shrink-0 animate-spin" />
          {loadingLabel}
        </div>
      )}
      {groups.map((group, groupIndex) => {
        const groupId = `${id}-group-${groupIndex}`;

        return (
          <Fragment key={group.name ?? '_'}>
            {group.name === undefined ? (
              groupIndex !== 0 && <Separator />
            ) : (
              <h3
                id={groupId}
                className="mb-3 px-3 py-1 text-xs font-medium [&:not(:first-child)]:mt-3"
                role="presentation"
              >
                {group.name}
              </h3>
            )}
            <div
              className="flex flex-col gap-2"
              role="group"
              aria-labelledby={group.name === undefined ? undefined : groupId}
            >
              {group.options.map((option) => (
                <AutocompleteListboxOption
                  key={option.index}
                  id={optionId(option.index)}
                  option={option}
                  isActive={activeIndex === option.index}
                  highlightText={highlightText}
                  onMouseDown={(event) => onOptionMouseDown(event, option)}
                  onMouseMove={() => onOptionMouseMove(option.index)}
                />
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

type AutocompleteListboxOptionProps = {
  id: string;
  option: IndexedAutocompleteOption;
  isActive: boolean;
  highlightText: string;
  onMouseDown: (event: MouseEvent) => void;
  onMouseMove: () => void;
};

function AutocompleteListboxOption({
  id,
  option,
  isActive,
  highlightText,
  onMouseDown,
  onMouseMove,
}: AutocompleteListboxOptionProps) {
  const appConfig = useAppConfig();
  const { Icon } = option;
  const parts = parse(option.value, match(option.value, highlightText));

  return (
    <div
      id={id}
      role="option"
      data-testid="autocomplete-option"
      aria-selected={isActive}
      className={cn(
        'flex cursor-pointer justify-between gap-2 px-3 py-2',
        isActive && SELECT_INTERACTIVE_ACTIVE_CLASSNAME,
      )}
      style={{ borderRadius: appConfig.brand.theme.borderRadius }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    >
      <span
        className={cn(
          'flex items-center gap-2 text-xs font-medium',
          isActive ? 'text-primary-foreground' : 'text-primary',
        )}
      >
        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
        <p>
          {parts.map((part, partIndex) => (
            <span
              key={partIndex}
              className={part.highlight ? 'font-semibold' : undefined}
            >
              {part.text}
            </span>
          ))}
        </p>
      </span>

      {option.badge && (
        <Badge
          variant="outline"
          className={cn(
            'w-[100px] shrink-0 text-xs',
            isActive &&
              'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground',
          )}
        >
          <p className="mx-auto truncate">{option.badge}</p>
        </Badge>
      )}
    </div>
  );
}
