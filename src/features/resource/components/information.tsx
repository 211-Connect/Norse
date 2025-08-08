import { Card, CardContent } from '@/shared/components/ui/card';
import { CopyBadge } from '@/shared/components/copy-badge';
import { MapContainer } from './map-container';
import { useTranslation } from 'next-i18next';
import {
  Clock,
  Edit,
  Globe,
  Mail,
  Mailbox,
  MapPin,
  Phone,
  Printer,
  Car,
} from 'lucide-react';
import { Link } from '@/shared/components/link';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { Separator } from '@/shared/components/ui/separator';
import { parseHtml } from '@/shared/lib/parse-html';

const isPhysicalAddressAvailable = (addresses: any[]) => {
  return addresses.filter((addr) => addr.type === 'physical').length > 0;
};

export function Information({ resource }) {
  const { t } = useTranslation('page-resource');

  return (
    <>
      <Card className="overflow-hidden print:border-none print:shadow-none">
        <MapContainer resource={resource} />

        <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          {!isPhysicalAddressAvailable(resource.addresses) && (
            <div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <p className="font-bold">{t('location')}</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm">
                        {t('search.address_unavailable', { ns: 'common' })}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="bottom">
                    <p>{t('search.confidential_address', { ns: 'common' })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {resource.addresses?.length > 0 &&
            resource.addresses
              .sort((a: any, b: any) => a.rank - b.rank)
              .map((address: any, key) => {
                return (
                  <div
                    key={key}
                    className={cn(
                      resource.addresses.length === 1 && 'col-span-2',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {address.type === 'physical' ? (
                        <MapPin className="size-4" />
                      ) : (
                        <Mailbox className="size-4" />
                      )}
                      <p className="font-bold">
                        {address.type === 'physical'
                          ? t('location')
                          : t('mail')}
                      </p>
                    </div>
                    <p className="text-sm">
                      {`${address.address_1},${address.address_2 ? ` ${address.address_2},` : ''} ${address.city}, ${address.stateProvince} ${address.postalCode}`}
                    </p>
                  </div>
                );
              })}

          {resource?.transportation && (
            <div className="col-span-2">
              <div className="flex items-center gap-1">
                <Car className="size-4" />
                <p className="font-bold">{t('transportation')}</p>
              </div>
              <p className="whitespace-break-spaces text-sm">
                {parseHtml(resource.transportation, {
                  parseLineBreaks: true,
                })}
              </p>
            </div>
          )}

          {resource?.hours && (
            <div className="col-span-2">
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <p className="font-bold">{t('hours')}</p>
              </div>
              <p className="whitespace-break-spaces text-sm">
                {parseHtml(resource.hours)}
              </p>
            </div>
          )}

          {resource.phoneNumbers?.length > 0 &&
            resource.phoneNumbers
              .sort((a: any, b: any) => a.rank - b.rank)
              .map((phone: any) => {
                return (
                  <div
                    key={phone.number}
                    className={cn(
                      resource.phoneNumbers.length === 1 && 'col-span-2',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {phone.type === 'fax' ? (
                        <Printer className="size-4" />
                      ) : (
                        <Phone className="size-4" />
                      )}
                      <p className="font-bold">
                        {phone.type === 'fax' ? t('fax') : t('voice')}
                      </p>
                    </div>
                    {phone.type === 'voice' ? (
                      <Link
                        className="text-sm hover:underline"
                        href={`tel:${phone.number}`}
                      >
                        {phone.number}
                      </Link>
                    ) : (
                      <p className="text-sm">{phone.number}</p>
                    )}

                    {phone.description && (
                      <p className="text-sm">{phone.description}</p>
                    )}
                  </div>
                );
              })}

          {resource.website && (
            <div className={cn(resource.email == null && 'col-span-2')}>
              <div className="flex items-center gap-1">
                <Globe className="size-4" />
                <p className="font-bold">{t('website')}</p>
              </div>
              <CopyBadge
                href={resource.website}
                text={resource.website}
                target="_blank"
                className="text-sm font-normal"
              >
                <p className="break-words text-sm">{resource.website}</p>
              </CopyBadge>
            </div>
          )}

          {resource.email && (
            <div>
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                <p className="font-bold">{t('email')}</p>
              </div>
              <Link
                className="text-sm hover:underline"
                href={`mailto:${resource.email}`}
              >
                {resource.email}
              </Link>
            </div>
          )}

          {resource?.applicationProcess &&
            resource.applicationProcess.length > 0 && (
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <Edit className="size-4" />
                  <p className="font-bold">{t('application_process')}</p>
                </div>
                <p className="whitespace-break-spaces text-sm">
                  {parseHtml(resource.applicationProcess)}
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
