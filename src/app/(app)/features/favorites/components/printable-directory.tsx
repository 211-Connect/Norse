/* eslint-disable @next/next/no-img-element */
'use client';

import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { type PrintableDirectoryData } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { PrintableDirectoryItem } from './printable-directory-item';

type PrintableDirectoryProps = {
  data: PrintableDirectoryData;
  variant: 'phone-book' | 'all-info';
};

export const PrintableDirectory = forwardRef<
  HTMLDivElement,
  PrintableDirectoryProps
>(({ data, variant }, ref) => {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();

  // Get current domain from browser
  const currentDomain =
    typeof window !== 'undefined' ? window.location.hostname : '';

  // Get current date formatted as MM/DD/YYYY
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <div
      ref={ref}
      className={`print-document text-foreground bg-white font-sans ${
        variant === 'phone-book' ? 'print-phone-book' : ''
      }`}
    >
      <table className="print-table">
        <thead>
          <tr>
            <th className="print-table-cell">
              <div className="print-header">
                <div className="flex items-start justify-between">
                  <Typography
                    variant="heading"
                    size="md"
                    className="text-left text-lg text-[20px] font-semibold"
                  >
                    {data.name}
                  </Typography>
                  <div className="flex flex-col gap-1">
                    <Typography
                      variant="paragraph"
                      size="sm"
                      className="text-right text-[14px] leading-tight font-normal text-black"
                    >
                      {currentDate}
                    </Typography>
                    <Typography
                      variant="paragraph"
                      size="sm"
                      className="text-right text-[14px] leading-tight font-medium text-black"
                    >
                      {currentDomain}
                    </Typography>
                  </div>
                </div>

                <div className="print-header-separator" />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="print-table-cell">
              <div className="print-content">
                {data.items.map((item) => (
                  <PrintableDirectoryItem
                    key={item.id}
                    item={item}
                    variant={variant}
                  />
                ))}
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td className="print-table-cell">
              <div className="print-footer">
                <div className="flex items-center gap-4">
                  {appConfig.brand.logoUrl && (
                    <div className="shrink-0">
                      <img
                        src={appConfig.brand.logoUrl}
                        alt={appConfig.brand.name}
                        style={{
                          width: '120px',
                          height: 'auto',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  )}

                  <Typography
                    variant="paragraph"
                    size="xs"
                    textColor="secondary"
                    className="flex-1 text-left text-[10px] leading-tight"
                  >
                    {t('print_footer_disclaimer', {
                      brandName: appConfig.brand.name,
                    })}
                  </Typography>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

PrintableDirectory.displayName = 'PrintableDirectory';
