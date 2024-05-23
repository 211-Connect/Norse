import { openContextModal } from '@mantine/modals';
import { IconChevronLeft, IconShare, IconHeartPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { Button, buttonVariants } from '../../ui/button';
import { cn } from '@/lib/utils';

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

  return (
    <div className="flex justify-between items-center w-full max-w-[1100px] mx-auto pt-2">
      <Link
        className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
        // disabled={props.backUrl === 'loading'}
        href={props.backUrl}
      >
        <IconChevronLeft className="size-4" />
        {props.backUrl === '/' ? t('back_to_home') : t('back_to_results')}
      </Link>

      <div className="flex gap-2">
        <Button
          className="gap-1"
          onClick={async () => {
            openContextModal({
              modal: 'share',
              centered: true,
              size: 320,
              innerProps: {
                shareContents: {
                  title: t('check_out_this_resource', { ns: 'common' }),
                  body: `${props.displayName}\n\n${props.serviceDescription}`,
                },
                printFn: handlePrint,
              },
            });
          }}
        >
          <IconShare className="size-4" />
          {t('call_to_action.share', { ns: 'common' })}
        </Button>

        <Button
          className="gap-1"
          onClick={async () => {
            if (status === 'unauthenticated') {
              openContextModal({
                title: t('modal.prompt_auth', { ns: 'common' }),
                modal: 'prompt-auth',
                centered: true,
                size: 320,
                innerProps: {},
              });
            } else if (status === 'authenticated') {
              openContextModal({
                modal: 'add-to-favorites',
                centered: true,
                innerProps: {
                  serviceAtLocationId: props.resourceId,
                },
              });
            }
          }}
        >
          <IconHeartPlus className="size-4" />
          {t('call_to_action.add_to_list', { ns: 'common' })}
        </Button>
      </div>
    </div>
  );
}
