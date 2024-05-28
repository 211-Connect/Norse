import React, { useEffect, useState } from 'react';
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
import LocationInput, { locationAtom } from '../components/location-input';
import { useForm } from '@tanstack/react-form';
import { useAtomValue } from 'jotai';

function useUpdateLocation(resource: any) {
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const UpdateLocation = () => {
    const { t } = useTranslation();
    const location = useAtomValue(locationAtom);
    const form = useForm({
      defaultValues: {
        location: location.value,
      },
    });

    useEffect(() => {
      form.setFieldValue('location', location.value);
    }, [location.value, form]);

    if (!isOpen) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('update_location.prompt_start_location')}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="location">
              {(field) => (
                <LocationInput className="w-full" name={field.name} />
              )}
            </form.Field>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t('call_to_action.cancel')}
            </Button>
            <ReferralButton
              referralType="directions_referral"
              resourceId={resource.id}
              resource={resource}
              target="_blank"
              href={`https://www.google.com/maps/dir/?api=1&origin=${location.coords
                .split(',')
                .reverse()
                .join(',')}&destination=${
                resource?.location?.coordinates
                  ? Array.from(resource?.location?.coordinates)
                      .reverse()
                      .join(',')
                  : ''
              }`}
            >
              {t('call_to_action.get_directions')}
            </ReferralButton>
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
