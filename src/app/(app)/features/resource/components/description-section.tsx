import { Badge, badgeVariants } from '@/app/(app)/shared/components/ui/badge';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';
import { cn } from '@/app/(app)/shared/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function DescriptionSection({ resource }) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');

  const showCategories = useFlag('showResourceCategories');
  const showLastAssured = useFlag('showResourceLastAssuredDate');
  const showAttribution = useFlag('showResourceAttribution');
  const turnResourceCardTaxonomiesIntoLinks = useFlag(
    'turnResourceCardTaxonomiesIntoLinks',
  );

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
              <h2 className="mb-4 font-medium">{t('description')}</h2>
              <p className="whitespace-break-spaces">
                {parseHtml(resource.description)}
              </p>
              {showLastAssured && (
                <div className="text-sm">
                  <h2 className="mb-1 mt-4 font-semibold">
                    {appConfig.resource.lastAssuredText || t('last_assured')}
                  </h2>
                  <p>{lastAssuredOn || t('unknown')}</p>
                </div>
              )}
              {showAttribution && resource.attribution != null && (
                <div className="text-sm">
                  <h2 className="mb-1 mt-4 font-semibold">
                    {t('data_providers.provided_by', {
                      ns: 'common',
                    })}
                  </h2>
                  <p>{resource.attribution || t('unknown')}</p>
                </div>
              )}
            </div>
          )}
          {categories?.length > 0 && (
            <div>
              <h2 className="mb-4 font-medium">{t('categories_title')}</h2>
              <div className="flex flex-wrap gap-1">
                {categories.map((el: any) => {
                  return turnResourceCardTaxonomiesIntoLinks ? (
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
                  ) : (
                    <Badge key={el.name} variant="default">
                      {el.name}
                    </Badge>
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
