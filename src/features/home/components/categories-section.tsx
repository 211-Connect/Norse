import { useTranslation } from 'next-i18next';
import { IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';
import { Link } from '@/shared/components/ui/link';
import { Separator } from '@/shared/components/ui/separator';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useCategories } from '@/shared/hooks/use-categories';

type Props = {
  index: string;
  name: string;
  image?: string;
  href?: string;
  subcategories: any[];
};

const Category = ({ image, name, href, subcategories }: Props) => {
  if (subcategories && subcategories.length > 0) {
    return (
      <div className="flex items-start gap-1">
        {image && (
          <Image
            src={image}
            alt=""
            width={80}
            height={0}
            className="h-auto w-10"
          />
        )}

        <div className="flex flex-col">
          <h3 className="text-xl font-semibold">{name}</h3>

          {subcategories.map((el, key) => (
            <Link
              className="flex gap-1 p-2 pl-1 pr-1 hover:bg-primary/20"
              key={el.name}
              href={`${
                el.href
                  ? el.href
                  : `/search?query=${encodeURIComponent(
                      el.query,
                    )}&query_label=${encodeURIComponent(
                      el.name,
                    )}&query_type=${encodeURIComponent(el.query_type)}`
              }`}
              prefetch={false}
            >
              {el.name}
              {el.href ? <IconExternalLink className="size-4" /> : null}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link href={href || '/'}>
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

export function CategoriesSection() {
  const { t } = useTranslation('page-home');
  const categories = useCategories();

  if ((categories?.length ?? 0) === 0) return null;

  return (
    <div className="categories container mx-auto pb-8 pt-8">
      <h3 className="text-2xl font-bold">{t('categories_title')}</h3>

      <Separator className="mb-4 mt-4" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((el: any) => (
          <Category key={el.name} {...el} />
        ))}
      </div>
    </div>
  );
}
