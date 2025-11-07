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

  const { categories, description } = useMemo(() => {
    const { categories = [], description } = resource ?? {};

    const filteredCategories = categories.filter(
      (el: any) => el?.name && el?.code,
    );
    return {
      categories: filteredCategories,
      description,
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
