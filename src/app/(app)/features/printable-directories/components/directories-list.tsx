'use client';

import { PlusIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ListSearchBar } from '@/app/(app)/shared/components/list-search-bar';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { createPrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectory';
import { Link } from '@/app/(app)/shared/components/link';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { getImageUrl } from '@/app/(app)/shared/utils/getImageUrl';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { AccessPolicy, ResourceLayout } from '@/types/printableDirectories';

import { CreateDirectoryDialog } from './create-directory-dialog';
import { DeleteDirectoryButton } from './delete-directory-button';
import { getAccessPolicyLabel, getResourceLayoutLabel } from '../utils';

type DirectoriesListProps = {
  locale: string;
  initialDirectories: PrintableDirectoryResponseDto[];
  initialLoadError?: boolean;
};

export function DirectoriesList({
  locale,
  initialDirectories,
  initialLoadError = false,
}: DirectoriesListProps) {
  const appConfig = useAppConfig();
  const { t } = useTranslation(['page-directories', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [directories, setDirectories] =
    useState<PrintableDirectoryResponseDto[]>(initialDirectories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLoadError) {
      toast.error(t('load_error', { ns: 'page-directories' }));
    }
  }, [initialLoadError, t]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return directories;

    return directories.filter((directory) =>
      directory.name.toLowerCase().includes(q),
    );
  }, [directories, searchQuery]);

  const handleCreateDirectory = async (values: {
    name: string;
    resourceLayout: ResourceLayout;
    accessPolicy: AccessPolicy;
    isBookletLayout: boolean;
    defaultQueryConfig: PrintableDirectoryResponseDto['defaultQueryConfig'];
  }) => {
    setIsSubmitting(true);

    try {
      const created = await createPrintableDirectory(
        values,
        appConfig.tenantId,
      );

      if (!created) {
        toast.error(
          t('unable_to_create_directory', { ns: 'page-directories' }),
        );
        return;
      }

      setDirectories((previous) => [created, ...previous]);
      setIsAddOpen(false);
      toast.success(t('directory_created', { ns: 'page-directories' }));
    } catch {
      toast.error(t('unable_to_create_directory', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDirectory = (id: string) => {
    setDirectories((previous) =>
      previous.filter((directory) => directory.id !== id),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 lg:pl-6">
      <Typography as="h1" className="mb-2 text-2xl font-semibold">
        {t('heading', { ns: 'page-directories' })}
      </Typography>

      <div className="flex w-full flex-col items-center gap-2 md:flex-row">
        {(directories.length > 0 || searchQuery) && (
          <ListSearchBar
            className="h-full w-full"
            placeholder={t('search_placeholder', { ns: 'page-directories' })}
            initialValue={searchQuery}
            onChange={setSearchQuery}
          />
        )}
        <Button
          type="button"
          variant="outline"
          className="h-9 self-start gap-1"
          onClick={() => setIsAddOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          {t('add_directory', { ns: 'page-directories' })}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-2">
              <Image
                src={getImageUrl('undraw_no_data.svg')}
                alt="Illustration of no data"
                height={150}
                width={0}
                style={{
                  height: '150px',
                  width: 'auto',
                }}
              />
            </CardContent>
            <CardHeader className="text-center">
              <CardTitle>
                {t('no_directories_found', { ns: 'page-directories' })}
              </CardTitle>
              <CardDescription>
                {t('try_different_search_or_create', {
                  ns: 'page-directories',
                })}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((directory) => (
              <Card key={directory.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardTitle className="mb-0 truncate text-base">
                      <Link href={`/${locale}/directories/${directory.id}`}>
                        {directory.name}
                      </Link>
                    </CardTitle>
                    <Badge variant="outline">
                      {getAccessPolicyLabel(directory.accessPolicy, t)}
                    </Badge>
                    <Badge variant="outline">
                      {getResourceLayoutLabel(directory.resourceLayout, t)}
                    </Badge>
                    <Badge variant="outline">
                      {t('sections_count', {
                        ns: 'page-directories',
                        count: directory.sections.length,
                      })}
                    </Badge>
                  </div>

                  <DeleteDirectoryButton
                    id={directory.id}
                    name={directory.name}
                    onDeleted={() => handleDeleteDirectory(directory.id)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateDirectoryDialog
        open={isAddOpen}
        isSubmitting={isSubmitting}
        onOpenChange={setIsAddOpen}
        onSubmit={handleCreateDirectory}
      />
    </div>
  );
}
