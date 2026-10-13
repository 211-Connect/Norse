'use client';

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { Label } from '@/app/(app)/shared/components/ui/label';

import { LAYOUT_ITEMS, LayoutItem } from '../../utils/constants';

type LayoutEditorProps = {
  kind: 'header' | 'footer';
  value: LayoutItem[];
  onChange: (next: LayoutItem[]) => void;
};

export function LayoutEditor({ kind, value, onChange }: LayoutEditorProps) {
  const { t } = useTranslation(['page-directories', 'common']);

  const getLayoutItemLabel = (item: LayoutItem) =>
    item === 'text'
      ? t(
          kind === 'header'
            ? 'layout_item_text_header'
            : 'layout_item_text_footer',
          { ns: 'page-directories' },
        )
      : t(`layout_item.${item}`, { ns: 'page-directories' });

  const selectedItems = value.filter((item) => LAYOUT_ITEMS.includes(item));
  const unselectedItems = LAYOUT_ITEMS.filter((item) => !value.includes(item));

  const selectLayoutItem = (item: LayoutItem) => {
    if (value.includes(item)) return;

    onChange([...value, item]);
  };

  const unselectLayoutItem = (item: LayoutItem) => {
    if (!value.includes(item)) return;

    onChange(value.filter((existing) => existing !== item));
  };

  const moveLayoutItem = (item: LayoutItem, direction: 'up' | 'down') => {
    const index = selectedItems.indexOf(item);
    if (index === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedItems.length) {
      return;
    }

    const next = [...selectedItems];
    const [moved] = next.splice(index, 1);
    if (!moved) {
      return;
    }
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>{t('layout_label', { ns: 'page-directories' })}</Label>
      <p className="text-sm text-muted-foreground">
        {t('layout_reorder_hint', {
          ns: 'page-directories',
          defaultValue:
            'Click + to add item to layout. Use arrows to re-order selected items.',
        })}
      </p>
      <div className="space-y-2">
        <div className="space-y-2">
          {selectedItems.length === 0 ? (
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {t('layout_no_selected_items', {
                ns: 'page-directories',
                defaultValue: 'No selected items.',
              })}
            </div>
          ) : (
            selectedItems.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{getLayoutItemLabel(item)}</span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index <= 0}
                    onClick={() => moveLayoutItem(item, 'up')}
                    aria-label={t('move_layout_item_up', {
                      ns: 'page-directories',
                      name: getLayoutItemLabel(item),
                    })}
                  >
                    <ArrowUpIcon className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={index === selectedItems.length - 1}
                    onClick={() => moveLayoutItem(item, 'down')}
                    aria-label={t('move_layout_item_down', {
                      ns: 'page-directories',
                      name: getLayoutItemLabel(item),
                    })}
                  >
                    <ArrowDownIcon className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => unselectLayoutItem(item)}
                    aria-label={t('remove_layout_item', {
                      ns: 'page-directories',
                      defaultValue: 'Remove {{name}} from selected items',
                      name: getLayoutItemLabel(item),
                    })}
                  >
                    <XIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t" />

        <div className="space-y-2">
          {unselectedItems.length === 0 ? (
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {t('layout_no_unselected_items', {
                ns: 'page-directories',
                defaultValue: 'No unselected items.',
              })}
            </div>
          ) : (
            unselectedItems.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span className="text-sm">{getLayoutItemLabel(item)}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => selectLayoutItem(item)}
                  aria-label={t('add_layout_item', {
                    ns: 'page-directories',
                    defaultValue: 'Add {{name}} to selected items',
                    name: getLayoutItemLabel(item),
                  })}
                >
                  <PlusIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
