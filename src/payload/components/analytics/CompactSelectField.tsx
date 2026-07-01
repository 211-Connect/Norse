'use client';

import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { useMemo, useState } from 'react';

type CompactSelectOption = {
  label: string;
  value: string;
};

type CompactSelectFieldProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  options: CompactSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  searchable?: boolean;
};

export default function CompactSelectField({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  emptyMessage = 'No results.',
  disabled = false,
  loading = false,
  error,
  searchable = false,
}: CompactSelectFieldProps) {
  const [open, setOpen] = useState(false);

  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((option) => {
      if (seen.has(option.value)) {
        return false;
      }
      seen.add(option.value);
      return true;
    });
  }, [options]);

  const selectedLabel = useMemo(
    () =>
      uniqueOptions.find((option) => option.value === value)?.label ??
      placeholder,
    [uniqueOptions, value, placeholder],
  );

  if (loading) {
    return (
      <div
        style={{
          width: 'fit-content',
          minWidth: '10rem',
          margin: '0 auto',
          padding: '0.375rem 0.625rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '0.375rem',
          background: 'var(--theme-elevation-50)',
          color: 'var(--theme-elevation-500)',
          fontSize: '0.8125rem',
        }}
      >
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          width: 'fit-content',
          minWidth: '10rem',
          margin: '0 auto',
          padding: '0.375rem 0.625rem',
          border: '1px solid var(--theme-error-200)',
          borderRadius: '0.375rem',
          background: 'var(--theme-error-50)',
          color: 'var(--theme-error-text)',
          fontSize: '0.8125rem',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            style={{
              width: 'fit-content',
              minWidth: '10rem',
              maxWidth: '16rem',
              padding: '0.375rem 0.625rem',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '0.375rem',
              background: 'var(--theme-elevation-0)',
              color: value ? 'var(--theme-text)' : 'var(--theme-elevation-500)',
              fontSize: '0.8125rem',
              textAlign: 'left',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedLabel}
            </span>
            <ChevronDownIcon />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="center"
            sideOffset={4}
            avoidCollisions
            style={{
              width: '14rem',
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: '14rem',
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            <Command
              filter={(value, search) =>
                value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
              }
            >
              {searchable && (
                <Command.Input
                  placeholder="Search…"
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.625rem',
                    border: 'none',
                    borderBottom: '1px solid var(--theme-elevation-150)',
                    background: 'transparent',
                    color: 'var(--theme-text)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                  }}
                />
              )}
              <Command.List
                style={{
                  maxHeight: '10rem',
                  overflow: 'auto',
                  padding: '0.25rem',
                }}
              >
                <Command.Empty
                  style={{
                    padding: '0.375rem 0.625rem',
                    fontSize: '0.8125rem',
                    color: 'var(--theme-elevation-500)',
                  }}
                >
                  {emptyMessage}
                </Command.Empty>
                {uniqueOptions.map((option) => (
                  <Command.Item
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value || null);
                      setOpen(false);
                    }}
                    style={{
                      padding: '0.375rem 0.625rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      color: 'var(--theme-text)',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background =
                        'var(--theme-elevation-50)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {option.label}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, color: 'var(--theme-elevation-500)' }}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
