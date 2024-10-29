import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { Link } from '@/shared/components/link';
import { Separator } from '@/shared/components/ui/separator';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useCategories } from '@/shared/hooks/use-categories';
import { ExternalLink } from 'lucide-react';

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
      <div className="flex items-start gap-2">
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
            >
              {el.name}
              {el.href ? <ExternalLink className="size-4" /> : null}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link href={href || '/'} className="group hover:underline">
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

      <div
        className={`grid gap-4 ${
          categories.length >= 4
            ? 'grid-cols-1 justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'mx-auto max-w-fit grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {categories.map((el: any) => (
          <Category key={el.name} {...el} />
        ))}
      </div>
    </div>
  );
}
