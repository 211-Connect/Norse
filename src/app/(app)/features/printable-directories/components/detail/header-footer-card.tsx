'use client';

import { PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { PrintableDirectoryHeaderFooterDto } from '@/lib/api/generated/data-contracts';

type LayoutItem = NonNullable<
  PrintableDirectoryHeaderFooterDto['layout']
>[number];

type HeaderFooterCardProps = {
  kind: 'header' | 'footer';
  title: string;
  text: string;
  layout: LayoutItem[];
  onEdit: () => void;
};

export function HeaderFooterCard({
  kind,
  title,
  text,
  layout,
  onEdit,
}: HeaderFooterCardProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const textLabel = t(
    kind === 'header' ? 'header_text_label' : 'footer_text_label',
    { ns: 'page-directories' },
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="mb-1 text-lg">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          className="gap-1"
          onClick={onEdit}
        >
          <PencilIcon className="size-4" aria-hidden="true" />
          {t('call_to_action.edit', { ns: 'common' })}
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <Typography as="p" variant="paragraph" size="sm">
          <span className="font-medium">
            {t('layout_label', { ns: 'page-directories' })}:
          </span>{' '}
          {layout
            .map((item) =>
              item === 'text'
                ? t(
                    kind === 'header'
                      ? 'layout_item_text_header'
                      : 'layout_item_text_footer',
                    { ns: 'page-directories' },
                  )
                : t(`layout_item.${item}`, { ns: 'page-directories' }),
            )
            .join(' - ')}
        </Typography>
        <Typography as="p" variant="paragraph" size="sm">
          <span className="font-medium">{textLabel}:</span> {text}
        </Typography>
      </CardContent>
    </Card>
  );
}
