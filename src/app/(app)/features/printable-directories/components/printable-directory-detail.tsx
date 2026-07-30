'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, CopyIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Link } from '@/app/(app)/shared/components/link';
import {
  Button,
  buttonVariants,
} from '@/app/(app)/shared/components/ui/button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { cn } from '@/app/(app)/shared/lib/utils';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { CloneDirectoryDialog } from './detail/clone-directory-dialog';
import { CoverCard } from './detail/cover-card';
import { GeneralInfoCard } from './detail/general-info-card';
import { HeaderFooterEditorCard } from './detail/header-footer-editor-card';
import { PrintPrintableDirectoryButton } from './detail/print-printable-directory-button';
import { SectionsEditorCard } from './detail/sections-editor-card';
import { SharePrintableDirectoryButton } from './detail/share-printable-directory-button';

type PrintableDirectoryDetailProps = {
  locale: string;
  initialDirectory: PrintableDirectoryResponseDto;
};

export function PrintableDirectoryDetail({
  locale,
  initialDirectory,
}: PrintableDirectoryDetailProps) {
  const { t } = useTranslation(['page-directories']);
  const router = useRouter();
  const [directory, setDirectory] = useState(initialDirectory);
  const [isCloneOpen, setIsCloneOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/${locale}/directories`}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'items-center gap-1',
            )}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {t('back_to_directories', { ns: 'page-directories' })}
          </Link>

          <div className="flex items-center gap-2">
            <PrintPrintableDirectoryButton directory={directory} />
            <SharePrintableDirectoryButton
              directory={directory}
              locale={locale}
            />

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setIsCloneOpen(true)}
            >
              <CopyIcon className="size-4" aria-hidden="true" />
              {t('clone_directory', { ns: 'page-directories' })}
            </Button>
          </div>
        </div>

        <Typography as="h1" className="text-2xl font-semibold">
          {directory.name}
        </Typography>
      </div>

      <GeneralInfoCard
        directory={directory}
        onDirectoryUpdated={setDirectory}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CoverCard directory={directory} onDirectoryUpdated={setDirectory} />

        <HeaderFooterEditorCard
          kind="header"
          directory={directory}
          onDirectoryUpdated={setDirectory}
        />

        <HeaderFooterEditorCard
          kind="footer"
          directory={directory}
          onDirectoryUpdated={setDirectory}
        />
      </div>

      <SectionsEditorCard
        directory={directory}
        onDirectoryUpdated={setDirectory}
      />

      <CloneDirectoryDialog
        open={isCloneOpen}
        directory={directory}
        onOpenChange={setIsCloneOpen}
        onCloned={(clonedDirectory) => {
          router.push(`/${locale}/directories/${clonedDirectory.id}`);
        }}
      />
    </div>
  );
}
