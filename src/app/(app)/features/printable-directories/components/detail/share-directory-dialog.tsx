'use client';

import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PrintFormatOptions } from '@/app/(app)/shared/components/directory-print/print-format-options';
import {
  type FontSizeMode,
  type PrintVariant,
} from '@/app/(app)/shared/components/directory-print/pdf-print-primitives';
import {
  PD_FONT_SIZE_PARAM,
  PD_SLUG_PARAM,
  PD_VARIANT_PARAM,
} from '@/app/(app)/shared/components/directory-print/share-link-params';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClipboard } from '@/app/(app)/shared/hooks/use-clipboard';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { RESOURCE_LAYOUT_TO_PRINT_VARIANT } from './print-printable-directory-button';

type ShareDirectoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directory: PrintableDirectoryResponseDto;
  locale: string;
};

export function ShareDirectoryDialog({
  open,
  onOpenChange,
  directory,
  locale,
}: ShareDirectoryDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const clipboard = useClipboard();

  const availableLocales = appConfig.i18n.locales;
  const defaultShareLocale = availableLocales.includes(locale)
    ? locale
    : appConfig.i18n.defaultLocale;

  const initialVariant: PrintVariant =
    directory.resourceLayout === 'custom-search' ||
    directory.resourceLayout === 'custom-resource'
      ? 'line-listing'
      : RESOURCE_LAYOUT_TO_PRINT_VARIANT[directory.resourceLayout];

  const [selectedVariant, setSelectedVariant] =
    useState<PrintVariant>(initialVariant);
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('default');
  const [selectedLocale, setSelectedLocale] = useState(defaultShareLocale);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedVariant(initialVariant);
    setFontSizeMode('default');
    setSelectedLocale(defaultShareLocale);
  }, [open]);

  const handleCopyLink = () => {
    if (!directory.slug) {
      return;
    }

    const params = new URLSearchParams({
      [PD_SLUG_PARAM]: directory.slug,
      [PD_VARIANT_PARAM]: selectedVariant,
      [PD_FONT_SIZE_PARAM]: fontSizeMode,
    });

    const shareUrl = withOptionalCustomBasePath(
      `${window.location.origin}/${selectedLocale}?${params.toString()}`,
    );

    clipboard.copy(shareUrl);
    toast.success(t('share_link_copied', { ns: 'page-directories' }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('share_dialog_title', { ns: 'page-directories' })}
          </DialogTitle>
          <DialogDescription>
            {t('share_dialog_description', { ns: 'page-directories' })}
          </DialogDescription>
        </DialogHeader>

        <PrintFormatOptions
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
          fontSizeMode={fontSizeMode}
          onFontSizeModeChange={setFontSizeMode}
          selectedLocale={selectedLocale}
          onSelectedLocaleChange={setSelectedLocale}
          availableLocales={availableLocales}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="button"
            onClick={handleCopyLink}
            className="gap-2"
            data-testid="copy-share-link-btn"
          >
            <Copy className="size-4" aria-hidden="true" />
            {t('copy_link_button', { ns: 'page-directories' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
