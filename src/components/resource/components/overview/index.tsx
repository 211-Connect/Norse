import { parseHtml } from '@/utils/parseHtml';
import { IconPhone, IconWorldWww, IconNavigation } from '@tabler/icons-react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ReferralButton } from '@/components/referral-button';
import { USER_PREF_COORDS, USER_PREF_LOCATION } from '@/constants/cookies';
import { useAppConfig } from '@/hooks/use-app-config';
import { Resource } from '@/lib/server/adapters/resource-adapter';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/utils';
import useUpdateLocation from '@/components/search/hooks/use-update-location';
import { useAtomValue } from 'jotai';
import { locationAtom } from '@/components/search/components/location-input';

type Props = {
  data: Resource;
};

export function ResourceOverview({ data }: Props) {
  const location = useAtomValue(locationAtom);
  const config = useAppConfig();
  const { UpdateLocation, open } = useUpdateLocation(data);

  const { t } = useTranslation('page-resource');

  const handleDirectionsClick = (e: any) => {
    if (location.coords?.length === 0 || !location.coords) {
      e.preventDefault();
      open();
    }
  };

  return (
    <>
      <Card id={data.id}>
        <CardContent className="p-4 gap-1 flex flex-col">
          <h3 className="text-2xl font-bold">{data.name}</h3>
          <p className="font-semibold text-primary text-lg">
            {data.serviceName}
          </p>

          <p className="whitespace-pre-wrap prose">
            {parseHtml(data.description ?? '')}
          </p>

          {config?.pages?.resource?.hideCategories ? null : (
            <>
              <h3 className="text-xl font-semibold text-primary">
                {t('categories')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.categories?.map((el: any) => {
                  return (
                    <Link
                      className={cn(badgeVariants({ variant: 'outline' }))}
                      key={el?.code}
                      href={`/search?query=${encodeURIComponent(
                        el?.code,
                      )}&query_label=${encodeURIComponent(
                        el?.name,
                      )}&query_type=taxonomy`}
                    >
                      {el?.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {config?.pages?.resource?.hideLastAssured ? null : (
            <>
              <h3 className="text-xl font-semibold text-primary">
                {t('last_assured')}
              </h3>
              <p className="text-sm">{data.lastAssuredOn || t('unknown')}</p>
            </>
          )}
        </CardContent>

        <CardFooter className="p-4">
          <div className="flex flex-col md:flex-row w-full gap-2">
            <ReferralButton
              className="w-full"
              referralType="call_referral"
              resourceId={data.id}
              resource={data}
              disabled={!data.phone || data.phone.length === 0}
              aria-disabled={!data.phone || data.phone.length === 0}
              href={`tel:${data.phone && data.phone.length > 0 && data.phone}`}
            >
              <IconPhone className="size-4" />
              {t('call_to_action.call', { ns: 'common' })}
            </ReferralButton>

            <ReferralButton
              className="w-full"
              referralType="website_referral"
              resourceId={data.id}
              resource={data}
              disabled={!data.website}
              aria-disabled={!data.website}
              href={data.website || ''}
              target="_blank"
            >
              <IconWorldWww className="size-4" />
              {t('call_to_action.view_website', { ns: 'common' })}
            </ReferralButton>

            <ReferralButton
              className="w-full"
              referralType="directions_referral"
              resourceId={data.id}
              resource={data}
              target="_blank"
              href={`https://www.google.com/maps/dir/?api=1&origin=${location.coords.split(',').slice().reverse().join(',')}&destination=${(
                data?.location?.coordinates ?? []
              )
                .slice()
                .reverse()
                .join(',')}`}
              onClick={handleDirectionsClick}
            >
              <IconNavigation className="size-4" />
              {t('call_to_action.get_directions', { ns: 'common' })}
            </ReferralButton>
          </div>
        </CardFooter>
      </Card>
      <UpdateLocation />
    </>
  );
}
