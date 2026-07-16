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
  title: string;
  text: string;
  layout: LayoutItem[];
  onEdit: () => void;
};

export function HeaderFooterCard({
  title,
  text,
  layout,
  onEdit,
}: HeaderFooterCardProps) {
  const { t } = useTranslation(['page-directories', 'common']);

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
          {layout.join(' - ')}
        </Typography>
        <Typography as="p" variant="paragraph" size="sm">
          <span className="font-medium">
            {t('text_label', { ns: 'page-directories' })}:
          </span>{' '}
          {text}
        </Typography>
      </CardContent>
    </Card>
  );
}
