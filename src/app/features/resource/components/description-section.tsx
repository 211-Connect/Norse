import { badgeVariants } from '@/app/shared/components/ui/badge';
import { Card, CardContent } from '@/app/shared/components/ui/card';
import { Separator } from '@/app/shared/components/ui/separator';
import { useFlag } from '@/app/shared/hooks/use-flag';
import { parseHtml } from '@/app/shared/lib/parse-html';
import { cn } from '@/app/shared/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function DescriptionSection({ resource }) {
  const { t } = useTranslation('page-resource');

  const showCategories = useFlag('showResourceCategories');

  const { categories, description } = useMemo(() => {
    const { categories = [], description } = resource ?? {};
    return {
      categories,
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
