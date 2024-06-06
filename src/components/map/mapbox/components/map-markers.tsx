import { useTranslation } from 'next-i18next';
import { Marker } from './marker';
import { ReferralButton } from '@/components/referral-button';
import RenderHtml from '@/components/render-html';
import { Globe, Phone } from 'lucide-react';
import { ISearchResult } from '@/types/search-result';
import { memo } from 'react';

// Memoized markers to prevent re-renders of map component
export const Markers = memo(function MemoizedMarkers({
  results,
}: {
  results: ISearchResult[];
}) {
  const { t } = useTranslation();

  return (
    <>
      {results.map((result) => {
        if (result?.location?.point?.coordinates == null) return null;

        return (
          <Marker
            key={result.id}
            latitude={result.location.point.coordinates[1]}
            longitude={result.location.point.coordinates[0]}
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

              marker.togglePopup();
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
