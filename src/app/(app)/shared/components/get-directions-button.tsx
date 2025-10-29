'use client';

import { ReferralButton } from '@/app/(app)/shared/components/referral-button';
import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Map } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '../lib/utils';

export function GetDirectionsButton({
  className = '',
  data,
  coords,
  text = '',
}) {
  const { t } = useTranslation('common');
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
  }, [data?.location?.coordinates]);

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
        size="sm"
        className={cn('gap1 flex-1', className)}
        referralType="directions_referral"
        resourceId={data.id}
        resourceData={data}
        variant="highlight"
        onClick={onClick}
      >
        <Map className="mr-[5px] size-4" />{' '}
        {text || t('call_to_action.get_directions')}
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
            <Button onClick={() => setOpen(false)} variant="outline">
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
              <Map className="mr-[5px] size-4" />
              {text || t('call_to_action.get_directions')}
            </ReferralButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
