import { ReferralButton } from '@/shared/components/referral-button';
import { LocationSearchBar } from '@/shared/components/search/location-search-bar';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Navigation } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useCallback, useState } from 'react';

export function GetDirectionsButton({ data, coords }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const getOrigin = useCallback(() => {
    if (coords) {
      return coords?.slice()?.reverse()?.join(',');
    }

    return '';
  }, [coords]);

  const getDestination = useCallback(() => {
    if (data?.location?.coordinates) {
      return data.location.coordinates?.slice()?.reverse()?.join(',');
    }

    return '';
  }, [data.location.coordinates]);

  const onClick = useCallback(
    (e) => {
      if (!getOrigin()) {
        e.preventDefault();
        setOpen(true);
      } else {
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${getOrigin()}&destination=${getDestination()}`,
          '_blank',
        );
      }
    },
    [getOrigin, getDestination],
  );

  return (
    <>
      <ReferralButton
        className="flex-1 gap-1"
        referralType="directions_referral"
        resourceId={data.id}
        resourceData={data}
        variant="outline"
        onClick={onClick}
      >
        <Navigation className="size-4" /> {t('call_to_action.get_directions')}
      </ReferralButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('update_location.prompt_start_location')}
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div>
            <LocationSearchBar />
          </div>

          <div className="flex items-center justify-between">
            <Button onClick={() => setOpen(false)}>
              {t('call_to_action.cancel')}
            </Button>

            <ReferralButton
              className="flex gap-1"
              disabled={!getOrigin()}
              referralType="directions_referral"
              resourceId={data.id}
              resourceData={data}
              variant="outline"
              onClick={onClick}
            >
              <Navigation className="size-4" />{' '}
              {t('call_to_action.get_directions')}
            </ReferralButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
