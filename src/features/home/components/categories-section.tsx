import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { Link } from '@/shared/components/link';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useCategories } from '@/shared/hooks/use-categories';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

type Props = {
  iconSize: 'small' | 'medium';
  index: string;
  name: string;
  image?: string;
  imageBorderRadius?: string | null;
  href?: string;
  target?: string;
  subcategories: any[];
};

const Category = ({
  iconSize,
  image,
  imageBorderRadius,
  name,
  href,
  target,
  subcategories,
}: Props) => {
  const sizeOfIcon = iconSize === 'small' ? 40 : 64;

  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex items-start gap-2">
        {image && (
          <Image
            src={image}
            alt=""
            width={sizeOfIcon}
            height={sizeOfIcon}
            className={cn(
              'rounded-xl object-cover',
              sizeOfIcon === 40 ? 'size-10' : 'size-16',
            )}
            style={{
              borderRadius: imageBorderRadius ?? undefined,
            }}
          />
        )}

        <div className="flex flex-col">
          <h3 className="mb-1 text-xl font-semibold">{name}</h3>

          {subcategories.map((el, key) => (
            <Link
              className="flex items-center gap-1 rounded-md p-2 pl-1 pr-1 hover:bg-primary/5"
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

  const iconSize = appConfig?.topicsConfig?.iconSize || 'small';

  return (
    <div className={cn('categories container mx-auto', className)}>
      {!appConfig.hideCategoriesHeading && (
        <div className="mb-10">
          <h2 className="text-center text-3xl font-bold">
            {t('search.categories_heading', {
              ns: 'dynamic',
              defaultValue: t('search.categories', { ns: 'common' }),
            })}
          </h2>
          <Separator className="my-3" />
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

      <div className="grid grid-cols-1 justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((el: any) => (
          <Category key={el.name} iconSize={iconSize} {...el} />
        ))}
      </div>
    </div>
  );
}
