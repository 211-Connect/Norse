'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { updatePrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectory';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { getPrintableDirectoryLocalizedText } from '../../utils/getPrintableDirectoryLocalizedText';
import { HeaderFooterCard } from './header-footer-card';
import { HeaderFooterDialog } from './header-footer-dialog';
import { HeaderFooterDialogValues } from '../../utils/dialog-types';
import { toLocalizedValues } from '../../utils/toLocalizedValues';

type HeaderFooterEditorCardProps = {
  kind: 'header' | 'footer';
  directory: PrintableDirectoryResponseDto;
  onDirectoryUpdated: (directory: PrintableDirectoryResponseDto) => void;
};

export function HeaderFooterEditorCard({
  kind,
  directory,
  onDirectoryUpdated,
}: HeaderFooterEditorCardProps) {
  const { t, i18n } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const value = kind === 'header' ? directory.header : directory.footer;

  const handleSubmit = async (values: HeaderFooterDialogValues) => {
    setIsSubmitting(true);

    try {
      const updated = await updatePrintableDirectory(
        directory.id,
        {
          [kind]: {
            textLocalized: values.textLocalized,
            layout: values.layout,
          },
        },
        appConfig.tenantId,
      );

      if (!updated) {
        toast.error(
          t('unable_to_update_header_footer', { ns: 'page-directories' }),
        );
        return;
      }

      onDirectoryUpdated(updated);
      toast.success(
        kind === 'header'
          ? t('header_updated', { ns: 'page-directories' })
          : t('footer_updated', { ns: 'page-directories' }),
      );
      setOpen(false);
    } catch {
      toast.error(
        t('unable_to_update_header_footer', { ns: 'page-directories' }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <HeaderFooterCard
        title={
          kind === 'header'
            ? t('header_config_title', { ns: 'page-directories' })
            : t('footer_config_title', { ns: 'page-directories' })
        }
        text={getPrintableDirectoryLocalizedText(
          value.textLocalized,
          i18n.language,
        )}
        layout={value.layout}
        onEdit={() => setOpen(true)}
      />

      <HeaderFooterDialog
        open={open}
        onOpenChange={setOpen}
        isSubmitting={isSubmitting}
        title={
          kind === 'header'
            ? t('edit_header_config', { ns: 'page-directories' })
            : t('edit_footer_config', { ns: 'page-directories' })
        }
        initialValues={{
          textLocalized: toLocalizedValues(value.textLocalized),
          layout: value.layout,
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
