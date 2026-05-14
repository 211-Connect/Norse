'use client';

import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Image } from '@/app/(app)/shared/components/image';
import { Link } from '@/app/(app)/shared/components/link';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useTopics } from '@/app/(app)/shared/hooks/use-topics';
import { NEW_TAB_WARNING } from '@/app/(app)/shared/lib/constants';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Topic } from '@/types/topics';

type Props = {
  topic: Topic;
  iconSize: 'small' | 'medium';
  imageBorderRadius?: number;
};

const Category = ({
  iconSize,
  imageBorderRadius,
  topic: { name, image, subtopics, href, target },
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
            style={{
              borderRadius: imageBorderRadius ?? undefined,
            }}
          />
        )}

        <div className="min-w-0 flex-1">
          <h3
            className="mb-1 break-words text-xl font-semibold"
            style={{ wordBreak: 'break-word' }}
          >
            {name}
          </h3>

          <ul className="space-y-1" aria-label={name}>
            {subtopics.map((el) => {
              const opensInNewTab = el.target === '_blank' && !!el.href;

              return (
                <li key={el.name}>
                  <Link
                    className="flex items-center gap-1 break-words rounded-md px-2 py-2 text-sm hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`${
                      el.href
                        ? el.href
                        : `/search?query=${encodeURIComponent(
                            el.query ?? '',
                          )}&query_label=${encodeURIComponent(
                            el.name,
                          )}&query_type=${encodeURIComponent(
                            el.queryType ?? '',
                          )}`
                    }`}
                    prefetch={false}
                    target={el.target}
                    aria-label={
                      opensInNewTab ? `${el.name}${NEW_TAB_WARNING}` : undefined
                    }
                  >
                    <span className="min-w-0 break-words">{el.name}</span>
                    {opensInNewTab ? (
                      <>
                        <ExternalLink
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">({NEW_TAB_WARNING})</span>
                      </>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
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
              <div
                className="relative mb-4 mt-4 h-20 w-20 overflow-hidden"
                style={{
                  borderRadius: imageBorderRadius ?? undefined,
                }}
              >
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

  if (topics.length === 0) return null;

  const iconSize = appConfig.topics.iconSize;
  const imageBorderRadius = appConfig.topics.imageBorderRadius;

  return (
    <div className={cn('categories container mx-auto', className)}>
      <div className="mb-4 sm:mb-8">
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

      <div className="grid grid-cols-1 justify-center gap-4 p-2 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 2xl:grid-cols-4">
        {topics.map((topic) => (
          <Category
            key={topic.name}
            iconSize={iconSize}
            imageBorderRadius={imageBorderRadius}
            topic={topic}
          />
        ))}
      </div>
    </div>
  );
}
