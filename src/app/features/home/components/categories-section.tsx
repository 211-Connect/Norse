'use client';

import Image from 'next/image';
import { Link } from '@/app/shared/components/link';
import { Card, CardContent } from '@/app/shared/components/ui/card';
import { useCategories } from '@/app/shared/hooks/use-categories';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/shared/components/ui/button';
import { cn } from '@/app/shared/lib/utils';

type Props = {
  index: string;
  name: string;
  image?: string;
  href?: string;
  target?: string;
  subcategories: any[];
};

const Category = ({ image, name, href, target, subcategories }: Props) => {
  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex items-start gap-5">
        {image && (
          <Image
            src={image}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-xl object-cover"
          />
        )}

        <div className="flex flex-col">
          <h3 className="mb-1 text-xl font-semibold">{name}</h3>

          {subcategories.map((el, key) => (
            <Link
              className="flex items-center gap-1 rounded-md p-1 pl-1 pr-1 hover:bg-primary/5"
              key={el.name}
              href={`${
                el.href
                  ? el.href
                  : `/search?query=${encodeURIComponent(
                      el.query,
                    )}&query_label=${encodeURIComponent(
                      el.name,
                    )}&query_type=${encodeURIComponent(el.queryType)}`
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
                  src={image}
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

export function CategoriesSection({
  className = '',
  backText,
}: {
  backText?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const appConfig = useAppConfig();
  const categories = useCategories();

  if ((categories?.length ?? 0) === 0) return null;

  return (
    <div
      className={cn('categories container mx-auto max-w-[872px]', className)}
    >
      {!appConfig.hideCategoriesHeading && (
        <div className="mb-10">
          <h3 className="text-center text-2xl font-medium">
            {t('search.categories_heading', {
              ns: 'dynamic',
              defaultValue: t('search.categories', { ns: 'common' }),
            })}
          </h3>
          {backText && (
            <Link href="/">
              <Button variant="link" className="">
                <ChevronLeft className="size-4" />
                {backText}
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 justify-center gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((el: any) => (
          <Category key={el.name} {...el} />
        ))}
      </div>
    </div>
  );
}
