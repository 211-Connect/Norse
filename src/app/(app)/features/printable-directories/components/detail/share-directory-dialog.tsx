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
  PD_BOOKLET_PARAM,
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
import { useClipboard } from '@/app/(app)/shared/hooks/use-clipboard';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

/**
 * Default print-time template when the dialog first opens. Ephemeral only —
 * never persisted. See docs/adr/0002-remove-resource-layout-and-booklet-fields.md.
 */
const DEFAULT_PRINT_VARIANT: PrintVariant = 'line-listing';

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
  const clipboard = useClipboard();

  // Only locales the directory actually has translated content for are
  // selectable when sharing — see docs/printable-directories.md ("A.II.
  // Localization & automatic translation"). This is always `directory.locales`
  // regardless of the sharing user's own capability (capability only
  // matters at edit time).
  const availableLocales = directory.locales;
  const defaultShareLocale = availableLocales.includes(locale)
    ? locale
    : directory.primaryLanguage;

  const [selectedVariant, setSelectedVariant] = useState<PrintVariant>(
    DEFAULT_PRINT_VARIANT,
  );
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('default');
  const [isBookletLayout, setIsBookletLayout] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(defaultShareLocale);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedVariant(DEFAULT_PRINT_VARIANT);
    setFontSizeMode('default');
    setIsBookletLayout(false);
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
      [PD_BOOKLET_PARAM]: String(isBookletLayout),
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
          isBookletLayout={isBookletLayout}
          onBookletLayoutChange={setIsBookletLayout}
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
