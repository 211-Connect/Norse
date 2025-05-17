'use client';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useCategories } from '@/lib/context/categories-context';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn-utils';
import { Category as CategoryType } from '@/types/category';

type Props = {
  category: CategoryType;
};

const Category = ({ category }: Props) => {
  const { subcategories, image, name, href, target } = category;

  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {image?.url && (
            <Image
              src={image.url}
              alt=""
              width={80}
              height={0}
              className="h-auto w-10"
            />
          )}
          <h3 className="text-lg font-medium">{name}</h3>
        </div>

        {subcategories.map((el) => (
          <Link
            className="ml-[40px] flex items-center gap-1 rounded-md p-2 px-2 hover:bg-primary/5"
            key={el.name}
            href={`${
              el.href
                ? el.href
                : `/search?query=${encodeURIComponent(
                    el.query || '',
                  )}&query_label=${encodeURIComponent(
                    el.name,
                  )}&query_type=${encodeURIComponent(el.queryType || '')}`
            }`}
            prefetch={false}
            target={el.target}
          >
            {el.name}
            {el.target === '_blank' && el.href ? (
              <ExternalLink className="size-4" />
            ) : (
              false
            )}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <Link href={href || '/'} className="group hover:underline" target={target}>
      <Card>
        <CardContent>
          {image && (
            <div className="flex flex-col items-center justify-center pb-8 pt-8">
              <div className="relative mb-4 mt-4 h-20 w-20 overflow-hidden rounded-full">
                <Image
                  src={image?.url}
                  alt=""
                  fill
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-center text-lg">{name}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export function CategoriesSection() {
  const t = useTranslations('page');
  const categories = useCategories();

  if ((categories?.length ?? 0) === 0) return null;

  return (
    <div className="categories container mx-auto py-8">
      <h3 className="text-xl font-semibold">{t('categories_title')}</h3>

      <Separator className="my-2" />

      <div
        className={cn(
          categories.length >= 4 &&
            'grid-cols-1 justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          categories.length === 3 &&
            'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          categories.length === 2 &&
            'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2',
          categories.length === 1 && 'mx-auto max-w-fit grid-cols-1',
          'grid gap-4',
        )}
      >
        {categories.map((category) => (
          <Category key={category.name} category={category} />
        ))}
      </div>
    </div>
  );
}
