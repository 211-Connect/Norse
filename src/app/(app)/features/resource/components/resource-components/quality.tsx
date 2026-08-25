'use client';

import { ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { QualityLink, Resource } from '@/types/resource';

import { Datum } from '../datum';
import { cn } from '@/app/(app)/shared/lib/utils';

interface QualityLinkGroup {
  subheadingText: string | null;
  links: QualityLink[];
}

export function QualityComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const qualityLinks = useMemo(
    () =>
      (resource.linkQualityUrls ?? []).filter(
        ({ displayText, url }) => Boolean(displayText) && Boolean(url),
      ),
    [resource.linkQualityUrls],
  );

  const hasAnySubheading = qualityLinks.some((link) =>
    Boolean(link.subheadingText),
  );

  const groups = useMemo<QualityLinkGroup[]>(() => {
    if (!hasAnySubheading) {
      return [{ subheadingText: null, links: qualityLinks }];
    }

    const orderedGroups: QualityLinkGroup[] = [];
    const groupIndexBySubheading = new Map<string, number>();
    const others: QualityLink[] = [];

    for (const link of qualityLinks) {
      if (!link.subheadingText) {
        others.push(link);
        continue;
      }

      const existingIndex = groupIndexBySubheading.get(link.subheadingText);
      if (existingIndex === undefined) {
        groupIndexBySubheading.set(link.subheadingText, orderedGroups.length);
        orderedGroups.push({
          subheadingText: link.subheadingText,
          links: [link],
        });
      } else {
        orderedGroups[existingIndex].links.push(link);
      }
    }

    if (others.length > 0) {
      orderedGroups.push({
        subheadingText: t('quality_others'),
        links: others,
      });
    }

    return orderedGroups;
  }, [qualityLinks, t]);

  if (qualityLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col py-2">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" className="size-4" />
        <Typography variant="label" size="sm" as="h3">
          {t('quality')}
        </Typography>
      </div>
      <div
        className={cn(
          'flex flex-col gap-2',
          hasAnySubheading ? 'pl-8 mt-2' : 'pl-6 mt-0.5',
        )}
      >
        {groups.map((group, groupIndex) => (
          <div
            key={`${group.subheadingText ?? 'flat'}-${groupIndex}`}
            className="flex flex-col"
          >
            {group.subheadingText && (
              <Typography variant="label" size="sm" as="h4">
                {group.subheadingText}
              </Typography>
            )}
            <ul className="flex flex-col">
              {group.links.map((link, linkIndex) => (
                <li key={`${link.url}-${linkIndex}`}>
                  <Datum
                    description={link.displayText}
                    url={link.url}
                    urlTarget="_blank"
                    shouldParseHtml={false}
                    withPadding={false}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
