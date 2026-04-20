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
import { useCallback, useId, useMemo, useRef, useState } from 'react';
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

  // True when we don't yet have the user's starting location and must prompt for it
  const needsOrigin = !coords || coords.length !== 2;

  const getOrigin = useCallback(() => {
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

  // Recomputed whenever origin or destination changes (covers the post-dialog-selection case)
  const mapsUrl = useMemo(
    () =>
      `https://www.google.com/maps/dir/?api=1&origin=${getOrigin()}&destination=${getDestination()}`,
    [getOrigin, getDestination],
  );

  // When rendered as <a> — href handles navigation, just fire analytics
  const onLinkClick = useCallback(() => {
    trackUmamiEvent(UmamiEvent.DirectionClick, { resourceId: String(data.id) });
  }, [data.id]);

  // When rendered as <button> — open dialog if no origin, otherwise navigate programmatically
  const onButtonClick = useCallback(
    (e: React.MouseEvent) => {
      if (!getOrigin()) {
        e.preventDefault();
        triggerRef.current = e.currentTarget as HTMLButtonElement;
        setOpen(true);
      } else {
        trackUmamiEvent(UmamiEvent.DirectionClick, {
          resourceId: String(data.id),
        });
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        setOpen(false);
      }
    },
    [getOrigin, mapsUrl, data.id],
  );

  const buttonContent = (
    <>
      <Map className="size-4 shrink-0" aria-hidden="true" />
      <span className="overflow-hidden text-ellipsis break-words">
        {text || t('call_to_action.get_directions')}
      </span>
    </>
  );

  const sharedAriaLabel = `${text || t('call_to_action.get_directions')}${data.name ? ` ${data.name}` : ''} ${t('modal.share.opens_in_new_tab')}`;

  return (
    <>
      <ReferralButton
        ref={needsOrigin ? triggerRef : undefined}
        size="sm"
        className={cn('flex-1 gap-1', className)}
        referralType="directions_referral"
        resourceId={data.id}
        resourceData={data}
        variant="highlight"
        aria-controls={needsOrigin ? dialogId : undefined}
        aria-haspopup={needsOrigin ? 'dialog' : undefined}
        aria-label={sharedAriaLabel}
        asChild={!needsOrigin}
        onClick={needsOrigin ? onButtonClick : onLinkClick}
      >
        {needsOrigin ? (
          buttonContent
        ) : (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            {buttonContent}
          </a>
        )}
      </ReferralButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id={dialogId}
          restoreFocusElement={triggerRef.current}
          closeLabel={t('call_to_action.close')}
        >
          <DialogHeader>
            <DialogTitle>
              {t('update_location.prompt_start_location')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('update_location.description')}
            </DialogDescription>
          </DialogHeader>

          <div>
            <LocationSearchBar
              mode="standalone"
              onLocationChange={(_location, coordinates) => {
                setSelectedCoordinates(coordinates);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button onClick={() => setOpen(false)} variant="outline">
              {t('call_to_action.cancel')}
            </Button>

            <ReferralButton
              className="gap-1"
              disabled={!getOrigin()}
              referralType="directions_referral"
              resourceId={data.id}
              resourceData={data}
              variant="outline"
              onClick={onButtonClick}
            >
              <Map className="size-4 shrink-0" aria-hidden="true" />
              {text || t('call_to_action.get_directions')}
            </ReferralButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
