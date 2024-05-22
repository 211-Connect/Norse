import { useEventStore } from '../../lib/hooks/useEventStore';
import { openContextModal } from '@mantine/modals';
import {
  IconHeart,
  IconLink,
  IconMapPin,
  IconNavigation,
  IconPhone,
  IconWorldWww,
} from '@tabler/icons-react';
import Link from 'next/link';
import { NextRouter } from 'next/router';
import { parseHtml } from '../../lib/utils/parseHtml';
import { useTranslation } from 'next-i18next';
import { Anchor } from '../atoms/anchor';
import { ReferralButton } from '../atoms/referral-button';
import { distanceBetweenCoordsInMiles } from '../../lib/utils/distenceBetweenCoords';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button, buttonVariants } from '../ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Spoiler } from '../ui/spoiler';

type Props = {
  id: string;
  serviceName: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
  coordinates: string;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  router: NextRouter;
  location: {
    coordinates: [number, number];
  };
};

export function Result(props: Props) {
  const { createLinkEvent } = useEventStore();
  const { t } = useTranslation('common');

  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  const handleDirectionsClick = (e: any) => {
    const coords = props?.coordinates ?? null;
    if (coords?.length === 0) {
      e.preventDefault();
      openContextModal({
        modal: 'update-location',
        centered: true,
        innerProps: {
          location: props.location,
        },
      });
    }
  };

  const distance =
    props?.location?.coordinates && props?.coordinates
      ? distanceBetweenCoordsInMiles(
          props.coordinates
            .split(',')
            .map((c) => parseFloat(c))
            .reverse() as [number, number],
          props.location.coordinates
        )
      : null;

  return (
    <Card id={props.id} className="shadow-md rounded-md outline-secondary">
      <CardHeader className="p-4">
        <h3 className="text-lg font-semibold">
          <Anchor
            href={`/search/${props.id}`}
            onClick={handleLink}
            className="text-primary"
          >
            {props.name}
          </Anchor>
        </h3>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <Spoiler
          hideLabel={t('call_to_action.show_less', { ns: 'common' })}
          showLabel={t('call_to_action.show_more', { ns: 'common' })}
        >
          <div className="whitespace-pre-wrap">
            {parseHtml(props.description ?? '')}
          </div>
        </Spoiler>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IconMapPin className="text-primary" />

            {props.address ? (
              <Badge>
                {props.address} {distance != null ? `- ${distance}mi` : null}
              </Badge>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge>{t('search.address_unavailable')}</Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-52 shadow-md" side="right">
                    <p>{t('search.confidential_address')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {props.phone && (
            <div className="flex items-center gap-2">
              <IconPhone className="text-primary" />
              <Badge>{props.phone}</Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 p-4 pt-0">
        <div className="flex flex-col w-full gap-2 lg:flex-row">
          <ReferralButton
            referralType="call_referral"
            resourceId={props.id}
            resource={props}
            disabled={!props.phone}
            aria-disabled={!props.phone}
            href={`tel:${props.phone}`}
            className="w-full"
          >
            <IconPhone className="size-4" />
            {t('call_to_action.call')}
          </ReferralButton>

          <ReferralButton
            referralType="website_referral"
            resourceId={props.id}
            resource={props}
            disabled={!props.website}
            aria-disabled={!props.website}
            href={props.website || ''}
            target="_blank"
            className="w-full"
          >
            <IconWorldWww className="size-4" />
            {t('call_to_action.view_website')}
          </ReferralButton>

          <ReferralButton
            referralType="directions_referral"
            resourceId={props.id}
            resource={props}
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&origin=${
              props.coordinates
            }&destination=${
              props?.location?.coordinates
                ? Array.from(props?.location?.coordinates).reverse().join(',')
                : ''
            }`}
            onClick={handleDirectionsClick}
            className="w-full"
          >
            <IconNavigation className="size-4" />
            {t('call_to_action.get_directions')}
          </ReferralButton>
        </div>

        <div className="w-full flex gap-1">
          <Link
            className={cn(
              buttonVariants({ variant: 'default' }),
              'w-full flex gap-2'
            )}
            href={`/search/${props.id}`}
          >
            <IconLink className="size-4" />
            {t('call_to_action.view_details')}
          </Link>

          <Button
            variant="default"
            size="icon"
            aria-label={t('call_to_action.add_to_list')}
            onClick={() => {
              if (props.sessionStatus === 'unauthenticated') {
                openContextModal({
                  title: t('modal.prompt_auth', { ns: 'common' }),
                  modal: 'prompt-auth',
                  centered: true,
                  size: 320,
                  innerProps: {},
                });
              } else if (props.sessionStatus === 'authenticated') {
                openContextModal({
                  modal: 'add-to-favorites',
                  centered: true,
                  innerProps: {
                    serviceAtLocationId: props.id,
                  },
                });
              }
            }}
          >
            <IconHeart className="size-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
