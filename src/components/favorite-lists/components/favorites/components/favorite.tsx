import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/constants/cookies';
import { Anchor } from '@/components/anchor';
import { ReferralButton } from '@/components/referral-button';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Spoiler } from '@/components/ui/spoiler';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSession } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import { deleteFavoriteFromFavoriteListDialogAtom } from '../state';
import RenderHtml from '@/components/render-html';
import {
  Calendar,
  Globe,
  HeartOff,
  Languages,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from 'lucide-react';

type Props = {
  id: string;
  displayName: string;
  displayPhoneNumber: string;
  serviceName: string;
  serviceDescription: string;
  website: string;
  email: string;
  phone: string;
  address: string | null;
  phoneNumbers: {
    number: string;
  }[];
  addresses: string[];
  location: {
    coordinates: number[];
  };
  hours: string;
  languages: string[];
  favoriteListId: string;
};

export function Favorite(props: Props) {
  const [cookies] = useCookies();
  const [coords, setCoords] = useState(null);
  const { t } = useTranslation('common');
  const session = useSession();
  const viewingAsOwner = session?.data?.user?.id;
  const setDeleteFavoriteFromList = useSetAtom(
    deleteFavoriteFromFavoriteListDialogAtom,
  );

  useEffect(() => {
    if (cookies[USER_PREF_COORDS] && cookies[USER_PREF_LOCATION]) {
      setCoords(cookies[USER_PREF_COORDS].split(',').reverse().join(','));
    }
  }, [cookies]);

  return (
    <Card id={props.id}>
      <CardHeader className="flex flex-col items-start justify-start">
        {props.serviceName && <Badge>{props.serviceName}</Badge>}

        <h3 className="text-xl font-bold text-primary">
          <Anchor href={`/search/${props.id}`}>{props.displayName}</Anchor>
        </h3>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <Spoiler
          hideLabel={t('call_to_action.show_less', { ns: 'common' })}
          showLabel={t('call_to_action.show_more', { ns: 'common' })}
        >
          <RenderHtml html={props.serviceDescription} />
        </Spoiler>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            <MapPin className="size-4" />

            {props.address ? (
              <Badge>{props.address}</Badge>
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

          <div className="flex gap-1">
            <Phone className="size-4" />

            {props.phoneNumbers?.map((el: any) => (
              <Badge key={el.number}>{el.number}</Badge>
            ))}
          </div>

          {props.website && (
            <div className="flex gap-1">
              <Globe className="size-4" />
              <Badge>{props.website}</Badge>
            </div>
          )}

          {props.email && (
            <div className="flex gap-1">
              <Mail className="size-4" />
              <Badge>
                <Anchor href={`mailto:${props.email}`}>{props.email}</Anchor>
              </Badge>
            </div>
          )}

          {props.hours && (
            <div className="flex gap-1">
              <Calendar className="size-4" />
              <Badge>{props.hours}</Badge>
            </div>
          )}

          {props.languages instanceof Array && props.languages.length > 0 && (
            <div className="flex gap-1">
              <Languages className="size-4" />

              {props.languages.map((el: string) => (
                <Badge key={el}>{el}</Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2">
        <div className="flex flex-col items-center gap-2 md:flex-row">
          <ReferralButton
            referralType="call_referral"
            resourceId={props.id}
            resource={props}
            disabled={
              !props.displayPhoneNumber && props.displayPhoneNumber.length === 0
            }
            aria-disabled={
              !props.displayPhoneNumber && props.displayPhoneNumber.length === 0
            }
            href={`tel:${props.displayPhoneNumber}`}
            className="w-full"
          >
            <Phone className="size-4" />
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
            <Globe className="size-4" />
            {t('call_to_action.view_website')}
          </ReferralButton>

          <ReferralButton
            referralType="directions_referral"
            resourceId={props.id}
            resource={props}
            disabled={props?.location?.coordinates == null || !coords}
            aria-disabled={props?.location?.coordinates == null || !coords}
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&origin=${coords}&destination=${Array.from(
              props?.location?.coordinates ?? [],
            )
              .reverse()
              .join(',')}`}
            className="w-full"
          >
            <Navigation className="size-4" />
            {t('call_to_action.get_directions')}
          </ReferralButton>
        </div>

        <div className="flex gap-2">
          <Link
            className={cn('w-full', buttonVariants({ variant: 'default' }))}
            href={`/search/${props.id}`}
          >
            {t('call_to_action.view_details')}
          </Link>

          {viewingAsOwner && (
            <Button
              size="icon"
              variant="default"
              aria-label={t('call_to_action.remove_from_list')}
              onClick={() => {
                setDeleteFavoriteFromList({
                  isOpen: true,
                  id: props.id,
                  favoriteListId: props.favoriteListId,
                });
              }}
            >
              <HeartOff className="size-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
