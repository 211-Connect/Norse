'use client';

import { UserRound, Phone, Send, IdCard } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { trackUmamiEvent, UmamiEvent } from '@/app/(app)/shared/lib/umami';

export function ContactsComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const sortedContacts = useMemo(() => {
    if (!resource.contacts || resource.contacts.length === 0) {
      return [];
    }

    return [...resource.contacts].sort((a, b) => a.priority - b.priority);
  }, [resource.contacts]);

  if (sortedContacts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <IdCard className="size-4" />
        <Typography variant="label" size="sm">
          {t('contacts')}
        </Typography>
      </div>
      <div className="flex flex-row flex-wrap gap-y-2">
        {sortedContacts.map((contact) => (
          <div key={contact.id} className="flex w-full flex-col pl-6 lg:w-1/2">
            <Datum
              icon={UserRound}
              description={
                contact.title
                  ? `${contact.name} (${contact.title})`
                  : contact.name
              }
              shouldParseHtml={false}
              className="py-0"
            />
            {contact.email && (
              <Datum
                icon={Send}
                description={contact.email}
                url={`mailto:${contact.email}`}
                shouldParseHtml={false}
                size="sm"
                className="py-0"
              />
            )}
            {contact.phones && contact.phones.length > 0 && (
              <div className="flex flex-col gap-2">
                {contact.phones.map((phone, index) => (
                  <Datum
                    key={`${contact.id}-${phone.number}-${index}`}
                    icon={Phone}
                    description={
                      phone.description
                        ? `${phone.number} (${phone.description})`
                        : phone.number
                    }
                    url={`tel:${phone.number}`}
                    onClick={() =>
                      trackUmamiEvent(UmamiEvent.PhoneClick, {
                        resourceId: resource.id,
                      })
                    }
                    urlTarget="_self"
                    shouldParseHtml={false}
                    size="sm"
                    className="py-0"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
