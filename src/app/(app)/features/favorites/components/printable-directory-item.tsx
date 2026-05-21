'use client';

import { Clock } from 'lucide-react';

import { type PrintableDirectoryItemData } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';

type PrintableDirectoryItemProps = {
  item: PrintableDirectoryItemData;
  variant: 'phone-book' | 'all-info';
};

export function PrintableDirectoryItem({
  item,
  variant,
}: PrintableDirectoryItemProps) {
  const displayName = item.displayName;
  const serviceName = item.serviceName;
  const description = item.description;
  const hours = item.hours;
  const displayAddress = item.address;
  const phone = item.phone;
  const email = item.email;
  const website = item.website;

  return (
    <div className="print-item mb-4 pb-4">
      {displayName && (
        <Typography
          variant="heading"
          size="xs"
          className="text-[16px] font-bold leading-tight"
        >
          {displayName}
        </Typography>
      )}

      <div className="print-item-content">
        {serviceName && (
          <Typography
            variant="paragraph"
            size="sm"
            className="mt-1.5 text-[14px] font-semibold leading-tight"
          >
            {serviceName}
          </Typography>
        )}

        {/* Two-column layout */}
        <div className="flex justify-between">
          {/* Left column: address, hours, website */}
          <div>
            {displayAddress && (
              <Typography
                variant="paragraph"
                size="sm"
                className="mt-1.5 text-[14px] font-normal leading-tight"
              >
                {displayAddress}
              </Typography>
            )}

            {hours && (
              <div className="mt-1.5 flex items-start gap-1">
                <Clock
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <Typography
                  variant="paragraph"
                  size="sm"
                  className="text-[12px] font-normal leading-tight"
                >
                  {hours}
                </Typography>
              </div>
            )}

            {website && (
              <Typography
                variant="paragraph"
                size="xs"
                textColor="secondary"
                className="mt-1.5 text-[12px] font-normal leading-tight underline"
              >
                {website}
              </Typography>
            )}
          </div>

          {/* Right column: phone, email */}
          <div className="shrink-0 whitespace-nowrap text-right">
            {phone && (
              <Typography
                variant="paragraph"
                size="sm"
                className="mt-1.5 text-[14px] font-normal leading-tight"
              >
                {phone}
              </Typography>
            )}

            {email && (
              <Typography
                variant="paragraph"
                size="xs"
                textColor="secondary"
                className="mt-1.5 text-[12px] font-normal leading-tight"
              >
                {email}
              </Typography>
            )}
          </div>
        </div>

        {variant === 'all-info' && description && (
          <div className="parsed-html-content mt-1.5 text-[12px] font-normal leading-tight">
            {parseHtml(description, { parseLineBreaks: true })}
          </div>
        )}
      </div>
    </div>
  );
}
