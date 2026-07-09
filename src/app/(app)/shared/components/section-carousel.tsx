'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  isValidElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';

import { HomeSection } from './home-section';

type SectionCarouselProps = {
  title?: string;
  items: ReactNode[];
  enableAutoplay?: boolean;
  autoplayIntervalMs?: number;
};

export function SectionCarousel({
  title,
  items,
  enableAutoplay = false,
  autoplayIntervalMs = 5000,
}: SectionCarouselProps) {
  const { t } = useTranslation('common');
  const useCarousel = items.length > 4;

  const getItemKey = (item: ReactNode, index: number) =>
    isValidElement(item) && item.key !== null
      ? String(item.key)
      : `item-${index}`;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: 'start',
      skipSnaps: false,
    },
    enableAutoplay && useCarousel
      ? [Autoplay({ delay: autoplayIntervalMs, stopOnInteraction: true })]
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
    if (!useCarousel) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect, useCarousel]);

  return (
    <HomeSection title={title}>
      {useCarousel ? (
        <div className="relative px-1 sm:px-16">
          {canScrollPrev && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-1/2 left-4 z-10 hidden -translate-y-1/2 rounded-full shadow-lg sm:inline-flex"
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
              className="absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 rounded-full shadow-lg sm:inline-flex"
              onClick={scrollNext}
              aria-label={t('carousel.next', 'Next')}
            >
              <ChevronRight className="size-4" />
            </Button>
          )}

          <div className="overflow-hidden px-8" ref={emblaRef}>
            <div className="flex gap-4">
              {items.map((item, index) => {
                const key = getItemKey(item, index);

                return (
                  <div
                    key={key}
                    className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_320px]"
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {items.map((item, index) => {
            const key = getItemKey(item, index);

            return (
              <div key={key} className="w-full sm:w-[320px]">
                {item}
              </div>
            );
          })}
        </div>
      )}
    </HomeSection>
  );
}
