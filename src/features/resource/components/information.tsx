import { Card, CardContent } from '@/shared/components/ui/card';
import { MapContainer } from './map-container';
import { useTranslation } from 'next-i18next';
import {
  Check,
  Clock,
  DollarSign,
  Edit,
  Folder,
  Globe,
  Languages,
  Mail,
  Mailbox,
  Map,
  MapPin,
  Phone,
  Printer,
} from 'lucide-react';
import { Link } from '@/shared/components/link';

export function Information({ resource }) {
  const { t } = useTranslation('page-resource');

  return (
    <Card className="overflow-hidden">
      <MapContainer resource={resource} />

      <CardContent className="grid grid-cols-1 gap-2 pt-4 md:grid-cols-2">
        {resource.addresses?.length > 0 &&
          resource.addresses
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((address: any, key) => {
              return (
                <div key={key}>
                  <div className="flex items-center gap-1">
                    {address.type === 'physical' ? (
                      <MapPin className="size-4" />
                    ) : (
                      <Mailbox className="size-4" />
                    )}
                    <p className="font-bold">
                      {address.type === 'physical' ? t('location') : t('mail')}
                    </p>
                  </div>
                  <p className="text-sm">{`${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`}</p>
                </div>
              );
            })}

        {resource.phoneNumbers?.length > 0 &&
          resource.phoneNumbers
            .sort((a: any, b: any) => a.rank - b.rank)
            .map((phone: any) => {
              return (
                <div key={phone.number}>
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
                </div>
              );
            })}

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

        {resource.website && (
          <div>
            <div className="flex items-center gap-1">
              <Globe className="size-4" />
              <p className="font-bold">{t('website')}</p>
            </div>
            <Link
              className="break-words text-sm hover:underline"
              href={resource.website}
            >
              {resource.website}
            </Link>
          </div>
        )}

        {resource?.hours && (
          <div>
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              <p className="font-bold">{t('hours')}</p>
            </div>
            <p className="text-sm">{resource.hours}</p>
          </div>
        )}

        {resource?.applicationProcess &&
          resource.applicationProcess.length > 0 && (
            <div>
              <div className="flex items-center gap-1">
                <Edit className="size-4" />
                <p className="font-bold">{t('application_process')}</p>
              </div>
              <p className="text-sm">{resource.applicationProcess}</p>
            </div>
          )}

        {resource?.requiredDocuments &&
          resource.requiredDocuments.length > 0 && (
            <div>
              <div className="flex items-center gap-1">
                <Folder className="size-4" />
                <p className="font-bold">{t('required_documents')}</p>
              </div>
              <p className="text-sm">{resource.requiredDocuments}</p>
            </div>
          )}

        {resource?.eligibilities && resource.eligibilities.length > 0 && (
          <div>
            <div className="flex items-center gap-1">
              <Check className="size-4" />

              <p className="font-bold">{t('eligibility')}</p>
            </div>

            <p className="text-sm">{resource.eligibilities}</p>
          </div>
        )}

        {resource?.fees && (
          <div>
            <div className="flex items-center gap-1">
              <DollarSign className="size-4" />

              <p className="font-bold">{t('fee')}</p>
            </div>
            <p className="text-sm">{resource.fees}</p>
          </div>
        )}

        {resource?.languages instanceof Array &&
          resource?.languages?.length > 0 && (
            <div>
              <div className="flex items-center gap-1">
                <Languages className="size-4" />
                <p className="font-bold">{t('languages')}</p>
              </div>
              {resource.languages.map((el: string) => (
                <p key={el} className="text-sm">
                  {el}
                </p>
              ))}
            </div>
          )}

        {resource?.serviceAreaDescription && (
          <div>
            <div className="flex items-center gap-1">
              <Map className="size-4" />
              <p className="font-bold">{t('service_area')}</p>
            </div>
            <p className="text-sm">{resource.serviceAreaDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
