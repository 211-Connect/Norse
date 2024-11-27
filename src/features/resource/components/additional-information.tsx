import { Card, CardContent } from '@/shared/components/ui/card';
import { useTranslation } from 'next-i18next';
import { Check, DollarSign, Folder, Languages, Map } from 'lucide-react';
import { Separator } from '@/shared/components/ui/separator';

export function AdditionalInformation({ resource }) {
  const { t } = useTranslation('page-resource');

  return (
    <>
      <Card className="overflow-hidden print:border-none print:shadow-none">
        <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          {resource?.fees && (
            <div className="col-span-2">
              <div className="flex items-center gap-1">
                <DollarSign className="size-4" />

                <p className="font-bold">{t('fee')}</p>
              </div>
              <p className="text-sm">{resource.fees}</p>
            </div>
          )}

          {resource?.requiredDocuments &&
            resource.requiredDocuments.length > 0 && (
              <div className="col-span-2">
                <div className="flex items-center gap-1">
                  <Folder className="size-4" />
                  <p className="font-bold">{t('required_documents')}</p>
                </div>
                <p className="text-sm">{resource.requiredDocuments}</p>
              </div>
            )}

          {resource?.eligibilities && resource.eligibilities.length > 0 && (
            <div className="col-span-2">
              <div className="flex items-center gap-1">
                <Check className="size-4" />

                <p className="font-bold">{t('eligibility')}</p>
              </div>

              <p className="text-sm">{resource.eligibilities}</p>
            </div>
          )}

          {resource?.languages instanceof Array &&
            resource?.languages?.length > 0 && (
              <div className="col-span-2">
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

          {(resource?.serviceAreaDescription || resource?.serviceAreaName) && (
            <div className="col-span-2">
              <div className="flex items-center gap-1">
                <Map className="size-4" />
                <p className="font-bold">{t('service_area')}</p>
              </div>
              {resource?.serviceAreaName && (
                <p className="text-sm">{resource.serviceAreaName}</p>
              )}

              {resource?.serviceAreaDescription && (
                <p className="text-sm">{resource.serviceAreaDescription}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
