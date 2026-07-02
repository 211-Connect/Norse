'use client';

import { ExternalLink } from 'lucide-react';

import { Link } from '@/app/(app)/shared/components/link';
import { MediaCard } from '@/app/(app)/shared/components/media-card';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { SectionCarousel } from '@/app/(app)/shared/components/section-carousel';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getStableKey } from '@/app/(app)/shared/lib/get-stable-key';

export function HighlightsSection() {
  const appConfig = useAppConfig();

  const highlights = appConfig.highlights?.items || [];
  const sectionTitle = appConfig.highlights?.sectionTitle;
  const enableAutoplay = appConfig.highlights?.enableCarouselAutoplay ?? false;
  const autoplayInterval = (appConfig.highlights?.autoplayInterval ?? 5) * 1000;

  if (highlights.length === 0) {
    return null;
  }

  const items = highlights.map((highlight, index) => {
    const key = getStableKey(
      [highlight.title, highlight.buttonUrl, highlight.image],
      `highlight-${index}`,
    );

    const hasButton = highlight.buttonText && highlight.buttonUrl;
    const footer =
      hasButton && highlight.buttonUrl ? (
        <Link
          href={highlight.buttonUrl}
          target={highlight.openInNewTab ? '_blank' : '_self'}
          className="w-full"
        >
          <Button variant="default" className="w-full gap-2">
            {highlight.buttonText}
            {highlight.openInNewTab && <ExternalLink className="size-4" />}
          </Button>
        </Link>
      ) : null;

    return (
      <MediaCard
        key={key}
        title={highlight.title}
        image={highlight.image}
        imageAlt={`${highlight.title} image`}
        description={highlight.description}
        footer={footer}
      />
    );
  });

  return (
    <SectionCarousel
      title={sectionTitle}
      items={items}
      enableAutoplay={enableAutoplay}
      autoplayIntervalMs={autoplayInterval}
    />
  );
}
