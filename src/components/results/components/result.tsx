import { useEventStore } from '@/hooks/use-event-store';
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
import { useTranslation } from 'next-i18next';
import { Anchor } from '@/components/anchor';
import { ReferralButton } from '@/components/referral-button';
import { distanceBetweenCoordsInMiles } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Spoiler } from '@/components/ui/spoiler';
import useAuthPrompt from '@/hooks/use-auth-prompt';
import useAddToList from '@/components/favorite-lists/hooks/use-add-to-list';
import useUpdateLocation from '@/components/search/hooks/use-update-location';
import { useAtomValue } from 'jotai';
import { locationAtom } from '@/components/search/components/location-input';
import { useMemo } from 'react';
import RenderHtml from '@/components/render-html';

type Props = {
  id: string;
  serviceName: string;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  website?: string;
  sessionStatus: 'authenticated' | 'loading' | 'unauthenticated';
  router: NextRouter;
  location: {
    coordinates: [number, number];
  };
};

const Distance = ({ resource }) => {
  const location = useAtomValue(locationAtom);

  const distance = useMemo(() => {
    return resource?.location?.coordinates && location.coords
      ? distanceBetweenCoordsInMiles(
          location.coords.split(',').map((c) => parseFloat(c)) as [
            number,
            number,
          ],
          resource.location.coordinates,
        )
      : null;
  }, [location?.coords, resource?.location]);

  if (distance == null) return null;
  return <>{`- ${distance}mi`}</>;
};

const GetDirections = ({ openUpdateLocation, resource }) => {
  const location = useAtomValue(locationAtom);
  const { t } = useTranslation();

  const handleDirectionsClick = (e: any) => {
    const coords = location.coords ?? null;
    if (coords?.length === 0) {
      e.preventDefault();
      openUpdateLocation();
    }
  };

  return (
    <ReferralButton
      referralType="directions_referral"
      resourceId={resource.id}
      resource={resource}
      target="_blank"
      href={`https://www.google.com/maps/dir/?api=1&origin=${location.coords
        .split(',')
        .slice()
        .reverse()
        .join(',')}&destination=${
        resource?.location?.coordinates
          ? Array.from(resource?.location?.coordinates).reverse().join(',')
          : ''
      }`}
      onClick={handleDirectionsClick}
      className="w-full"
    >
      <IconNavigation className="size-4" />
      {t('call_to_action.get_directions')}
    </ReferralButton>
  );
};

export function Result(props: Props) {
  const { createLinkEvent } = useEventStore();
  const { t } = useTranslation('common');
  const { open: openAuthPrompt, AuthPrompt } = useAuthPrompt();
  const { open: openAddToList, AddToFavoriteListDialog } = useAddToList(
    props.id,
  );
  const { open: openUpdateLocation, UpdateLocation } = useUpdateLocation(props);

  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  return (
    <>
      <Card id={props.id} className="rounded-md shadow-md outline-secondary">
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
            <RenderHtml html={props?.description} />
          </Spoiler>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <IconMapPin className="text-primary" />

              {props.address ? (
                <Badge>
                  {props.address} <Distance resource={props} />
                </Badge>
              ) : (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge>{t('search.address_unavailable')}</Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-52 shadow-md" side="right">
                    <p>{t('search.confidential_address')}</p>
                  </TooltipContent>
                </Tooltip>
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
          <div className="flex w-full flex-col gap-2 lg:flex-row">
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

            <GetDirections
              resource={props}
              openUpdateLocation={openUpdateLocation}
            />
          </div>

          <div className="flex w-full gap-1">
            <Link
              className={cn(
                buttonVariants({ variant: 'default' }),
                'flex w-full gap-2',
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
                  openAuthPrompt();
                } else if (props.sessionStatus === 'authenticated') {
                  openAddToList();
                }
              }}
            >
              <IconHeart className="size-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      <AuthPrompt />
      <AddToFavoriteListDialog />
      <UpdateLocation />
    </>
  );
}
