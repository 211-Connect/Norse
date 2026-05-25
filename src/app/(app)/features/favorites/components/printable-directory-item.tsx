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
          className="text-[16px] leading-tight font-bold"
        >
          {displayName}
        </Typography>
      )}

      <div className="print-item-content">
        {serviceName && (
          <Typography
            variant="paragraph"
            size="sm"
            className="mt-1.5 text-[14px] leading-tight font-semibold"
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
                className="mt-1.5 text-[14px] leading-tight font-normal"
              >
                {displayAddress}
              </Typography>
            )}

            {hours && (
              <div className="mt-1.5 flex items-start gap-1">
                <Clock
                  className="text-muted-foreground size-3 shrink-0"
                  aria-hidden="true"
                />
                <Typography
                  variant="paragraph"
                  size="sm"
                  className="text-[12px] leading-tight font-normal"
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
                className="mt-1.5 text-[12px] leading-tight font-normal underline"
              >
                {website}
              </Typography>
            )}
          </div>

          {/* Right column: phone, email */}
          <div className="shrink-0 text-right whitespace-nowrap">
            {phone && (
              <Typography
                variant="paragraph"
                size="sm"
                className="mt-1.5 text-[14px] leading-tight font-normal"
              >
                {phone}
              </Typography>
            )}

            {email && (
              <Typography
                variant="paragraph"
                size="xs"
                textColor="secondary"
                className="mt-1.5 text-[12px] leading-tight font-normal"
              >
                {email}
              </Typography>
            )}
          </div>
        </div>

        {variant === 'all-info' && description && (
          <div className="parsed-html-content mt-1.5 text-[12px] leading-tight font-normal">
            {parseHtml(description, { parseLineBreaks: true })}
          </div>
        )}
      </div>
    </div>
  );
}
