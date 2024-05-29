import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAppConfig } from '@/hooks/use-app-config';
import { Anchor } from '@/components/anchor';
import { IconPhone } from '@tabler/icons-react';
import { Card, CardDescription, CardFooter, CardHeader } from '../../ui/card';
import { buttonVariants } from '../../ui/button';
import { cn } from '@/utils';

type Props = {
  showAltSubtitle?: boolean;
};

export function NoResultsCard(props: Props) {
  const { t } = useTranslation('page-search');
  const config = useAppConfig() as any;
  const router = useRouter();

  return (
    <Card className="text-center">
      <CardHeader className="p-4 pb-0 flex items-center">
        <Image
          src="/undraw_searching.svg"
          width={0}
          height={150}
          alt=""
          style={{ height: '150px', width: 'auto' }}
        />
        <p>{t('no_results.title')}</p>
        <p className="bg-yellow-100 p-1 font-semibold">
          {router.query.query_label || router.query.query}
        </p>
      </CardHeader>
      <CardDescription className="p-4">
        {!props.showAltSubtitle
          ? t('no_results.subtitle')
          : config?.contact?.number
            ? t('no_results.need_help')
            : t('no_results.alt_subtitle')}
      </CardDescription>

      {config?.contact?.number && (
        <CardFooter className="p-4 pt-0">
          <Anchor
            className={cn(buttonVariants({ variant: 'default' }), 'gap-1')}
            href={`tel:${config.contact.number}`}
          >
            <IconPhone className="size-4" />
            {config.contact.number}
          </Anchor>
        </CardFooter>
      )}
    </Card>
  );
}
