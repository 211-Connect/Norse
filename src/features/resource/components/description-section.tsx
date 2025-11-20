import { badgeVariants } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { useFlag } from '@/shared/hooks/use-flag';
import { parseHtml } from '@/shared/lib/parse-html';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useMemo } from 'react';

export function DescriptionSection({ resource }) {
  const { t } = useTranslation('page-resource');

  const showCategories = useFlag('showResourceCategories');
  const showLastAssured = useFlag('showResourceLastAssuredDate');
  const showAttribution = useFlag('showResourceAttribution');

  const { categories, description, lastAssuredOn } = useMemo(() => {
    const { categories = [], description, lastAssuredOn } = resource ?? {};

    const filteredCategories = categories.filter(
      (el: any) => el?.name && el?.code,
    );
    return {
      categories: filteredCategories,
      description,
      lastAssuredOn,
    };
  }, [resource]);

  const shouldRender =
    description || (showCategories && categories?.length > 0);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <Card className="overflow-hidden print:border-none">
        <CardContent className="flex flex-col gap-8">
          {description && (
            <div>
              <h4 className="mb-4 font-medium">{t('description')}</h4>
              <p className="whitespace-break-spaces">
                {parseHtml(resource.description)}
              </p>
              {showLastAssured && (
                <div className="text-sm">
                  <h4 className="mb-1 mt-4 font-semibold">
                    {t('last_assured_text', {
                      ns: 'dynamic',
                      defaultValue: t('last_assured'),
                    })}
                  </h4>
                  <p>{lastAssuredOn || t('unknown')}</p>
                </div>
              )}
              {showAttribution && resource.attribution != null && (
                <div className="text-sm">
                  <h4 className="mb-1 mt-4 font-semibold">
                    {t('data_providers.provided_by', {
                      ns: 'common',
                    })}
                  </h4>
                  <p>{resource.attribution || t('unknown')}</p>
                </div>
              )}
            </div>
          )}
          {categories?.length > 0 && (
            <div>
              <h4 className="mb-4 font-medium">{t('categories_title')}</h4>
              <div className="flex flex-wrap gap-1">
                {categories.map((el: any) => {
                  return (
                    <Link
                      key={el?.code}
                      className={cn(badgeVariants(), 'hover:underline')}
                      href={`/search?query=${encodeURIComponent(
                        el?.code,
                      )}&query_label=${encodeURIComponent(
                        el?.name,
                      )}&query_type=taxonomy`}
                    >
                      {el?.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
