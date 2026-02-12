'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { CreateFavoriteListDialog } from '@/app/(app)/shared/components/create-favorite-list-dialog';
import { cn } from '@/app/(app)/shared/lib/utils';
import { PlusIcon } from 'lucide-react';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { favoriteListsStateAtom } from '@/app/(app)/shared/store/favorites';

export function CreateAListButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const { searchParamsObject, stringifySearchParams } = useClientSearchParams();
  const { totalCount, limit } = useAtomValue(favoriteListsStateAtom);

  const handleSuccess = async () => {
    if (pathname) {
      const newTotalCount = totalCount + 1;
      const newPage = Math.ceil(newTotalCount / limit);

      const newParams = new URLSearchParams();
      Object.entries(searchParamsObject).forEach(([key, value]) => {
        if (typeof value === 'string') {
          newParams.set(key, value);
        }
      });
      newParams.set('page', newPage.toString());

      router.replace(`${pathname}${stringifySearchParams(newParams)}`);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn('flex gap-1', className)}
      >
        <PlusIcon className="size-4" />
        {t('modal.create_list.create_a_list')}
      </Button>
      <CreateFavoriteListDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
