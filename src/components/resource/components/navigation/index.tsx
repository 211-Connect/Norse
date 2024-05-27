import { IconChevronLeft, IconHeartPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { Button, buttonVariants } from '../../../ui/button';
import { cn } from '@/utils';
import { ShareButton } from '@/components/share';
import useAuthPrompt from '@/lib/hooks/use-auth-prompt';
import useAddToList from '@/components/favorite-lists/hooks/use-add-to-list';

type Props = {
  backUrl: 'loading' | string;
  resourceId: string;
  displayName: string;
  serviceDescription: string;
  componentToPrint: any;
};

export function ResourceNavigation(props: Props) {
  const { t } = useTranslation('page-resource');
  const { status } = useSession();
  const handlePrint = useReactToPrint({
    content: () => props.componentToPrint.current,
  });
  const { open: openAuthPrompt, AuthPrompt } = useAuthPrompt();
  const { open: openAddToList, AddToFavoriteListDialog } = useAddToList(
    props.resourceId
  );

  return (
    <>
      <div className="flex justify-between items-center w-full max-w-[1100px] mx-auto pt-2">
        <Link
          className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
          href={props.backUrl}
        >
          <IconChevronLeft className="size-4" />
          {props.backUrl === '/' ? t('back_to_home') : t('back_to_results')}
        </Link>

        <div className="flex gap-2">
          <ShareButton
            title={t('check_out_this_resource', { ns: 'common' })}
            body={`${props.displayName}\n\n${props.serviceDescription}`}
            printFn={handlePrint}
          />

          <Button
            className="gap-1"
            onClick={async () => {
              if (status === 'unauthenticated') {
                openAuthPrompt();
              } else if (status === 'authenticated') {
                openAddToList();
              }
            }}
          >
            <IconHeartPlus className="size-4" />
            {t('call_to_action.add_to_list', { ns: 'common' })}
          </Button>
        </div>
      </div>
      <AuthPrompt />
      <AddToFavoriteListDialog />
    </>
  );
}
