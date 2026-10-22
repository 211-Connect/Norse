'use client';

import { BookOpen, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getPrintableDirectoryLocalizedText } from '@/app/(app)/features/printable-directories/utils';
import { Link } from '@/app/(app)/shared/components/link';
import {
  Alert,
  AlertDescription,
} from '@/app/(app)/shared/components/ui/alert';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { PrintableDirectorySearchContext } from '@/app/(app)/shared/hooks/use-printable-directory-search-context';

type PrintableDirectoryContextBannerProps = {
  context: PrintableDirectorySearchContext;
  onDismiss: () => void;
};

/**
 * Tells the user that Save targets the printable directory section they
 * came from; dismissing it returns Save to its normal behavior.
 */
export function PrintableDirectoryContextBanner({
  context,
  onDismiss,
}: PrintableDirectoryContextBannerProps) {
  const { t, i18n } = useTranslation('common');
  const { directory, section, source, sourceIndex } = context;

  const interpolation = {
    index: sourceIndex + 1,
    section: getPrintableDirectoryLocalizedText(
      section.headingLocalized,
      i18n.language,
      directory.primaryLanguage,
    ),
    directory: directory.name,
    // React escapes the rendered text already.
    interpolation: { escapeValue: false },
  };

  return (
    <Alert role="status" className="flex items-start gap-3 border-primary/40">
      {/* Wrapped: Alert absolutely positions a direct svg child. */}
      <span className="mt-0.5 shrink-0 text-primary">
        <BookOpen className="size-4" aria-hidden="true" />
      </span>
      <AlertDescription className="flex-1 space-y-1">
        <p>
          {source
            ? t('printable_directories.search_context.editing', interpolation)
            : t('printable_directories.search_context.adding', interpolation)}
        </p>
        <Link
          href={`/directories/${directory.id}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('printable_directories.search_context.back_to_directory')}
        </Link>
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-mt-1.5 -mr-2 size-8 shrink-0"
        onClick={onDismiss}
        aria-label={t('printable_directories.search_context.dismiss')}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </Button>
    </Alert>
  );
}
