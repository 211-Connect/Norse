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
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { parseHtml } from '@/shared/lib/parse-html';
import { userCoordinatesAtom } from '@/shared/store/search';
import { useAtomValue } from 'jotai';
import { Globe, Phone } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

export function Overview({ resource }) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');
  const coords = useAtomValue(userCoordinatesAtom);

  return (
    <div className="flex-1">
      <Card>
        <CardHeader>
          <CardTitle>{resource.name}</CardTitle>
          <CardDescription>{resource.serviceName}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm">{parseHtml(resource.description)}</p>

          {appConfig?.pages?.resource?.hideCategories ? null : (
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">
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
                      className={badgeVariants({ variant: 'outline' })}
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

          {appConfig?.pages?.resource?.hideLastAssured ? null : (
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold">
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

          {appConfig?.hideAttribution || resource.attribution == null ? null : (
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
