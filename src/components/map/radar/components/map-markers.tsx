import { ISearchResult } from '@/types/search-result';
import { memo } from 'react';
import Marker from './marker';
import RenderHtml from '@/components/render-html';
import { ReferralButton } from '@/components/referral-button';
import { Globe, Phone } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export const Markers = memo(function MemoizedMarkers({
  results,
  zoom,
}: {
  results: ISearchResult[];
  zoom?: number;
}) {
  const { t } = useTranslation();

  if (!results || results.length === 0) return null;

  return (
    <>
      {results.map((result) => {
        if (result?.location?.point?.coordinates == null) return null;

        return (
          <Marker
            key={result.id}
            longitude={result.location.point.coordinates[0]}
            latitude={result.location.point.coordinates[1]}
            className="custom-marker"
            onClick={(e, marker) => {
              e.preventDefault();
              e.stopPropagation();
              const element = document.getElementById(result.id);

              document
                .querySelectorAll('.outline')
                .forEach((elem) => elem.classList.remove('outline'));

              if (element) {
                element.classList.add('outline');
                element.scrollIntoView();
              }
            }}
            popup={
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">{result.name}</h3>

                <div className="text-sm">
                  <RenderHtml html={result?.description} />
                </div>

                <div className="flex gap-2">
                  <ReferralButton
                    referralType="call_referral"
                    resourceId={result.id}
                    resource={result}
                    disabled={!result.phone}
                    href={`tel:${result.phone}`}
                    className="w-full min-w-[130px] gap-1"
                  >
                    <Phone className="size-4" />
                    {t('call_to_action.call', {
                      ns: 'common',
                    })}
                  </ReferralButton>

                  <ReferralButton
                    referralType="website_referral"
                    resourceId={result.id}
                    resource={result}
                    disabled={!result.website}
                    href={result?.website ?? ''}
                    target="_blank"
                    className="w-full min-w-[130px] gap-1"
                  >
                    <Globe className="size-4" />
                    {t('call_to_action.view_website', {
                      ns: 'common',
                    })}
                  </ReferralButton>
                </div>
              </div>
            }
          />
        );
      })}
    </>
  );
});
