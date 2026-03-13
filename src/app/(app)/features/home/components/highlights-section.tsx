'use client';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { Image } from '@/app/(app)/shared/components/image';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { Link } from '@/app/(app)/shared/components/link';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export function HighlightsSection() {
  const appConfig = useAppConfig();
  const { t } = useTranslation('common');

  const highlights = appConfig.highlights?.items || [];
  const sectionTitle = appConfig.highlights?.sectionTitle;
  const enableAutoplay = appConfig.highlights?.enableCarouselAutoplay ?? false;
  const autoplayInterval = (appConfig.highlights?.autoplayInterval ?? 5) * 1000;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: 'start',
      skipSnaps: false,
    },
    enableAutoplay
      ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: true })]
      : [],
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      {sectionTitle && (
        <div className="mb-6">
          <h2 className="text-center text-3xl font-bold">{sectionTitle}</h2>
          <Separator className="mt-3" />
        </div>
      )}

      <div className="relative">
        {/* Navigation Buttons */}
        {canScrollPrev && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-lg sm:inline-flex"
            onClick={scrollPrev}
            aria-label={t('carousel.previous', 'Previous')}
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}

        {canScrollNext && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full shadow-lg sm:inline-flex"
            onClick={scrollNext}
            aria-label={t('carousel.next', 'Next')}
          >
            <ChevronRight className="size-4" />
          </Button>
        )}

        {/* Embla Carousel Container */}
        <div className="overflow-hidden px-8" ref={emblaRef}>
          <div className="flex gap-4">
            {highlights.map((highlight, index) => {
              const hasButton = highlight.buttonText && highlight.buttonUrl;

              return (
                <div
                  key={`${highlight.title}-${index}`}
                  className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%]"
                >
                  <Card className="flex h-full flex-col gap-2 sm:gap-4">
                    {highlight.image && (
                      <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-t-lg">
                        <Image
                          src={highlight.image}
                          alt={`${highlight.title} image`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="text-xl">
                        {highlight.title}
                      </CardTitle>
                    </CardHeader>

                    {highlight.description && (
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          {highlight.description}
                        </p>
                      </CardContent>
                    )}

                    {hasButton && highlight.buttonUrl && (
                      <CardFooter>
                        <Link
                          href={highlight.buttonUrl}
                          target={highlight.openInNewTab ? '_blank' : '_self'}
                          className="w-full"
                        >
                          <Button variant="default" className="w-full gap-2">
                            {highlight.buttonText}
                            {highlight.openInNewTab && (
                              <ExternalLink className="size-4" />
                            )}
                          </Button>
                        </Link>
                      </CardFooter>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
