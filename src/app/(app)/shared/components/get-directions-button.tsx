'use client';

import { ReferralButton } from '@/app/(app)/shared/components/referral-button';
import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Map } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { trackUmamiEvent, UmamiEvent } from '../lib/umami';

export function GetDirectionsButton({
  className = '',
  data,
  coords,
  text = '',
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    number[] | null
  >(null);
  const needsOrigin = !coords || coords.length !== 2;

  const getOrigin = useCallback(() => {
    // Use selected coordinates from dialog if available, otherwise use props
    const originCoords = selectedCoordinates || coords;
    if (originCoords && originCoords.length === 2) {
      return originCoords?.slice()?.reverse()?.join(',');
    }

    return '';
  }, [coords, selectedCoordinates]);

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
        triggerRef.current = e.currentTarget;
        setOpen(true);
      } else {
        trackUmamiEvent(UmamiEvent.DirectionClick, {
          resourceId: String(data.id),
        });
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${getOrigin()}&destination=${getDestination()}`,
          '_blank',
          'noopener,noreferrer',
        );
      }
    },
    [getOrigin, getDestination, data.id],
  );

  return (
    <>
      <ReferralButton
        ref={triggerRef}
        size="sm"
        className={cn('gap1 flex-1', className)}
        referralType="directions_referral"
        resourceId={data.id}
        resourceData={data}
        variant="highlight"
        aria-controls={needsOrigin ? dialogId : undefined}
        aria-haspopup={needsOrigin ? 'dialog' : undefined}
        aria-label={`${text || t('call_to_action.get_directions')}${data.name ? ` ${data.name}` : ''} ${t('modal.share.opens_in_new_tab')}`}
        onClick={onClick}
      >
        <Map className="mr-[5px] size-4" />{' '}
        <span className="truncate">
          {text || t('call_to_action.get_directions')}
        </span>
      </ReferralButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent id={dialogId} restoreFocusElement={triggerRef.current}>
          <DialogHeader>
            <DialogTitle>
              {t('update_location.prompt_start_location')}
            </DialogTitle>
          </DialogHeader>

          <div>
            <LocationSearchBar
              mode="standalone"
              onLocationChange={(location, coordinates) => {
                setSelectedCoordinates(coordinates);
              }}
            />
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
