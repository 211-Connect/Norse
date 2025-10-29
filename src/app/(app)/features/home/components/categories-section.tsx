'use client';

import { Image } from '@/app/(app)/shared/components/image';
import { Link } from '@/app/(app)/shared/components/link';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { useTopics } from '@/app/(app)/shared/hooks/use-topics';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useTranslation } from 'react-i18next';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';

type Props = {
  iconSize: 'small' | 'medium';
  index: string;
  name: string;
  image?: string;
  href?: string;
  target?: string;
  subtopics: any[];
};

const Category = ({
  iconSize,
  image,
  name,
  href,
  target,
  subtopics,
}: Props) => {
  const sizeOfIcon = iconSize === 'small' ? 40 : 64;

  if (subtopics && subtopics.length > 0) {
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
          />
        )}

        <div className="flex flex-col">
          <h3 className="mb-1 text-xl font-semibold">{name}</h3>

          {subtopics.map((el) => (
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
  const topics = useTopics();
  const hideCategoriesHeading = useFlag('hideCategoriesHeading');

  if (topics.length === 0) return null;

  const iconSize = appConfig.topics.iconSize;

  return (
    <div className={cn('categories container mx-auto', className)}>
      {!hideCategoriesHeading && (
        <div className="mb-10">
          <h2 className="text-center text-3xl font-bold">
            {appConfig.topics.customHeading ||
              t('search.categories', { ns: 'common' })}
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
        {topics.map((el: any) => (
          <Category key={el.name} iconSize={iconSize} {...el} />
        ))}
      </div>
    </div>
  );
}
