import { parseHtml } from '@/lib/utils/parseHtml';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Link } from '@/shared/components/link';
import { cn } from '@/shared/lib/utils';
import { ResultType } from '@/shared/store/results';
import { Globe, Heart, LinkIcon, Navigation, Phone } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { ReferralLink } from '@/shared/components/referral-link';

type ResultProps = {
  data: ResultType;
};

export function Result({ data }: ResultProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{data.name}</CardTitle>
      </CardHeader>
      <CardContent>{parseHtml(data.description)}</CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full items-center gap-2">
          <ReferralLink
            className="flex-1 gap-1"
            referralType="call_referral"
            resourceId={data.id}
            resource={data}
            href={`tel:${data.phone}`}
            variant="outline"
          >
            <Phone className="size-4" /> {t('call_to_action.call')}
          </ReferralLink>

          <ReferralLink
            className="flex-1 gap-1"
            referralType="website_referral"
            resourceId={data.id}
            resource={data}
            href={data.website || ''}
            target="_blank"
            variant="outline"
          >
            <Globe className="size-4" /> {t('call_to_action.view_website')}
          </ReferralLink>

          <ReferralLink
            className="flex-1 gap-1"
            referralType="directions_referral"
            resourceId={data.id}
            resource={data}
            target="_blank"
            // href={`https://www.google.com/maps/dir/?api=1&origin=${
            //   props.coordinates
            // }&destination=${
            //   props?.location?.coordinates
            //     ? Array.from(props?.location?.coordinates).reverse().join(',')
            //     : ''
            // }`}
            href=""
            variant="outline"
          >
            <Navigation className="size-4" />{' '}
            {t('call_to_action.get_directions')}
          </ReferralLink>
        </div>

        <div className="flex w-full items-center gap-2">
          <Link
            className={cn('flex-1 gap-1', buttonVariants())}
            href={`/search/${data.id}`}
          >
            <LinkIcon className="size-4" /> {t('call_to_action.view_details')}
          </Link>

          <Button size="icon">
            <Heart className="size-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
