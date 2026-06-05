'use client';

import { Map } from 'lucide-react';
import { type MouseEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { ResultType } from '@/app/(app)/shared/store/results';
import { Address, Resource } from '@/types/resource';

import { UmamiEvent, trackUmamiEvent } from '../lib/umami';
import { cn } from '../lib/utils';

interface GetDirectionsButtonProps {
  className?: string;
  data: Resource | ResultType;
  coords?: number[] | null;
  text?: string;
}

function buildAddressString(data: Resource | ResultType): string {
  if (data.address) return data.address;

  const addresses = 'addresses' in data ? data.addresses : null;
  const primary =
    addresses?.find((a: Address) => a.rank === 1) ?? addresses?.[0];
  if (!primary) return '';

  return [
    primary.address_1,
    primary.address_2,
    primary.city,
    primary.stateProvince,
    primary.postalCode,
  ]
    .filter(Boolean)
    .join(', ');
}

function buildMapsUrl(originStr: string, destinationStr: string): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  if (originStr) url.searchParams.set('origin', originStr);
  url.searchParams.set('destination', destinationStr);
  return url.href;
}

export function GetDirectionsButton({
  className = '',
  data,
  coords,
  text = '',
}: GetDirectionsButtonProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    number[] | null
  >(null);

  // True when we don't yet have the user's starting location and must prompt for it
  const needsOrigin = !coords || coords.length !== 2;

  const originCoords = selectedCoordinates ?? coords;
  const originStr =
    originCoords && originCoords.length === 2
      ? `${originCoords[1]},${originCoords[0]}`
      : '';

  const destinationStr = buildAddressString(data);

  const mapsUrl = buildMapsUrl(originStr, destinationStr);

  function trackDirectionsClick() {
    trackUmamiEvent(UmamiEvent.DirectionClick, { resourceId: String(data.id) });
  }

  // When rendered as <button> — open dialog if no origin, otherwise navigate programmatically
  function onButtonClick(e: MouseEvent) {
    if (!originStr) {
      e.preventDefault();
      triggerRef.current = e.currentTarget as HTMLButtonElement;
      setOpen(true);
    } else {
      trackDirectionsClick();
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      setOpen(false);
    }
  }

  const buttonContent = (
    <>
      <Map className="size-4 shrink-0" aria-hidden="true" />
      <span className="overflow-hidden break-words text-ellipsis">
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
        className={cn('flex-1 gap-1 print:hidden', className)}
        referralType="directions_referral"
        resourceId={data.id}
        resourceData={data}
        variant="highlight"
        aria-controls={needsOrigin ? dialogId : undefined}
        aria-haspopup={needsOrigin ? 'dialog' : undefined}
        aria-label={sharedAriaLabel}
        asChild={!needsOrigin}
        onClick={needsOrigin ? onButtonClick : trackDirectionsClick}
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

          <div className="min-h-60">
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
              disabled={!originStr}
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
