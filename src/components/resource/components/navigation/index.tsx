import { IconChevronLeft, IconHeartPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { Button, buttonVariants } from '../../../ui/button';
import { cn } from '@/utils';
import { ShareButton } from '@/components/share';
import useAuthPrompt from '@/hooks/use-auth-prompt';
import useAddToList from '@/components/favorite-lists/hooks/use-add-to-list';
import { useCookies } from 'react-cookie';
import {
  USER_PREF_BACK_ACTION,
  USER_PREF_LAST_QUERY,
} from '@/constants/cookies';
import { setCookie } from 'nookies';
import { useRouter } from 'next/router';

type Props = {
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
  const router = useRouter();
  const [cookies] = useCookies([USER_PREF_LAST_QUERY]);

  return (
    <>
      <div className="flex justify-between items-center w-full max-w-[1100px] mx-auto pt-2">
        <Button
          onClick={async () => {
            if (cookies[USER_PREF_LAST_QUERY] == null) {
              await router.push('/');
            } else {
              setCookie(null, USER_PREF_BACK_ACTION, 'true', { path: '/' });
              await router.push('/search');
            }
          }}
        >
          <IconChevronLeft className="size-4" />
          {cookies[USER_PREF_LAST_QUERY] == null
            ? t('back_to_home')
            : t('back_to_results')}
        </Button>

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
