import { GetDirectionsButton } from '@/shared/components/get-directions-button';
import { ReferralButton } from '@/shared/components/referral-button';
import { badgeVariants } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useFlag } from '@/shared/hooks/use-flag';
import { parseHtml } from '@/shared/lib/parse-html';
import { cn } from '@/shared/lib/utils';
import { userCoordinatesAtom } from '@/shared/store/search';
import { useAtomValue } from 'jotai';
import { Globe, Phone } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export function Overview({ resource }) {
  const { t } = useTranslation('page-resource');
  const coords = useAtomValue(userCoordinatesAtom);
  const showCategories = useFlag('showResourceCategories');
  const showLastAssured = useFlag('showResourceLastAssuredDate');
  const showAttribution = useFlag('showResourceAttribution');
  const showServiceName = useFlag('showSearchAndResourceServiceName');

  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>{resource.name}</CardTitle>
          {showServiceName && (
            <CardDescription>{resource.serviceName}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="whitespace-break-spaces">
            {parseHtml(resource.description)}
          </p>

          {showCategories && (
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                {t('categories_text', {
                  ns: 'dynamic',
                  defaultValue: t('categories'),
                })}
              </h3>
              <div className="flex flex-wrap gap-1">
                {resource.categories?.map((el: any) => {
                  return (
                    <Link
                      key={el?.code}
                      className={cn(badgeVariants(), 'hover:underline')}
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
            </div>
          )}

          {showLastAssured && (
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                {t('last_assured_text', {
                  ns: 'dynamic',
                  defaultValue: t('last_assured'),
                })}
              </h3>
              <p className="text-sm">
                {resource.lastAssuredOn || t('unknown')}
              </p>
            </div>
          )}

          {showAttribution && resource.attribution != null && (
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">
                {t('data_providers.provided_by', {
                  ns: 'common',
                })}
              </h3>
              <p className="text-sm">{resource.attribution || t('unknown')}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch justify-stretch gap-2 lg:flex-row lg:items-center print:hidden">
          <ReferralButton
            size="sm"
            className="flex-1 gap-1"
            disabled={!resource.phone}
            referralType="call_referral"
            resourceId={resource.id}
            resourceData={resource}
            variant="highlight"
            onClick={() => {
              window.open(`tel:${resource.phone}`);
            }}
          >
            <Phone className="size-4" />{' '}
            {t('call_to_action.call', { ns: 'common' })}
          </ReferralButton>

          <ReferralButton
            size="sm"
            className="flex-1 gap-1"
            referralType="website_referral"
            resourceId={resource.id}
            resourceData={resource}
            disabled={!resource.website}
            variant="highlight"
            onClick={() => {
              window.open(resource.website, '_blank');
            }}
          >
            <Globe className="size-4" />{' '}
            {t('call_to_action.view_website', { ns: 'common' })}
          </ReferralButton>

          <GetDirectionsButton data={resource} coords={coords} />
        </CardFooter>
      </Card>
    </div>
  );
}
