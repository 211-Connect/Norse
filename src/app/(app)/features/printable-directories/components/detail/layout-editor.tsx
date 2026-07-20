'use client';

import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
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

  const toggleLayoutItem = (item: LayoutItem, checked: boolean) => {
    const nextItems = checked
      ? [...value, item]
      : value.filter((existing) => existing !== item);

    // Layout items are always saved in a fixed, canonical order
    // (logo, text, domain, date), regardless of toggle order.
    onChange(
      LAYOUT_ITEMS.filter((layoutItem) => nextItems.includes(layoutItem)),
    );
  };

  return (
    <div className="space-y-2">
      <Label>{t('layout_label', { ns: 'page-directories' })}</Label>
      <p className="text-sm text-muted-foreground">
        {t('layout_checkbox_hint', {
          ns: 'page-directories',
          defaultValue: 'Select the items to include in the layout.',
        })}
      </p>
      <div className="space-y-2">
        {LAYOUT_ITEMS.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
          >
            <Checkbox
              id={`layout-item-${item}`}
              checked={value.includes(item)}
              onCheckedChange={(checked) =>
                toggleLayoutItem(item, checked === true)
              }
            />
            <Label
              htmlFor={`layout-item-${item}`}
              className="text-sm font-normal"
            >
              {getLayoutItemLabel(item)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
