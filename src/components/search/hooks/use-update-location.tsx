import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { ReferralButton } from '@/components/referral-button';

function useUpdateLocation(resource: any) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const UpdateLocation = () => {
    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('update_location.prompt_start_location')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t('call_to_action.cancel')}
            </Button>
            {/* <ReferralButton
          referralType="directions_referral"
          resourceId={resource.id}
          resource={resource}
          target="_blank"
          href={`https://www.google.com/maps/dir/?api=1&origin=${coords
            .split(',')
            .reverse()
            .join(',')}&destination=${
            props?.innerProps?.location?.coordinates
              ? Array.from(props?.innerProps?.location?.coordinates)
                  .reverse()
                  .join(',')
              : ''
          }`}
        >
          {t('call_to_action.get_directions')}
        </ReferralButton> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return {
    isOpen,
    open,
    close,
    UpdateLocation,
  };
}

export default useUpdateLocation;
