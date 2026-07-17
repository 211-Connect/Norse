'use client';

import { ArrowDownIcon, ArrowUpIcon, PencilIcon } from 'lucide-react';
import qs from 'qs';
import { useTranslation } from 'react-i18next';

import { Link } from '@/app/(app)/shared/components/link';
import { Button } from '@/app/(app)/shared/components/ui/button';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { PrintableDirectorySectionResponseDto } from '@/lib/api/generated/data-contracts';

import { getPrintableDirectoryLocalizedText } from '../../utils/getPrintableDirectoryLocalizedText';
import { CollapseToggleButton } from './collapse-toggle-button';
import { SectionSourceItem } from './section-source-item';

type SectionItemProps = {
  directoryId: string;
  section: PrintableDirectorySectionResponseDto;
  index: number;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isReorderingSections: boolean;
  isMutatingSources: boolean;
  onEditSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  isSourceExpanded: (sourceId: string) => boolean;
  onToggleSourceExpand: (sourceId: string) => void;
  onMoveSource: (
    sectionId: string,
    sourceId: string,
    direction: 'up' | 'down',
  ) => void;
  onDeleteSource: (sectionId: string, sourceId: string) => void;
};

export function SectionItem({
  directoryId,
  section,
  index,
  isLast,
  isExpanded,
  onToggleExpand,
  isReorderingSections,
  isMutatingSources,
  onEditSection,
  onMoveSection,
  isSourceExpanded,
  onToggleSourceExpand,
  onMoveSource,
  onDeleteSource,
}: SectionItemProps) {
  const { t, i18n } = useTranslation(['page-directories', 'common']);

  const sectionName = getPrintableDirectoryLocalizedText(
    section.headingLocalized,
    i18n.language,
  );

  const directoryQueryParams = {
    pdid: directoryId,
    pdsid: section.id,
  };
  const searchHref = `/search?${qs.stringify(directoryQueryParams, {
    encodeValuesOnly: true,
  })}`;
  const favoritesHref = `/favorites?${qs.stringify(directoryQueryParams, {
    encodeValuesOnly: true,
  })}`;

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Typography as="p" variant="heading" size="sm">
            {index + 1}. {sectionName}
          </Typography>
          -
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">{t('max_resources')}:</span>{' '}
            {section.maxResources}
          </Typography>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSection(section.id, 'up')}
            disabled={isReorderingSections || index === 0}
            aria-label={t('move_section_up', { name: sectionName })}
          >
            <ArrowUpIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSection(section.id, 'down')}
            disabled={isReorderingSections || isLast}
            aria-label={t('move_section_down', { name: sectionName })}
          >
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onEditSection(section.id)}
            aria-label={t('call_to_action.edit', { ns: 'common' })}
          >
            <PencilIcon className="size-4" aria-hidden="true" />
          </Button>
          <CollapseToggleButton
            isExpanded={isExpanded}
            onToggle={onToggleExpand}
            expandLabel={t('expand_section', { name: sectionName })}
            collapseLabel={t('collapse_section', { name: sectionName })}
          />
        </div>
      </div>

      {isExpanded ? (
        <>
          <Typography
            as="p"
            variant="paragraph"
            size="sm"
            textColor="secondary"
          >
            {getPrintableDirectoryLocalizedText(
              section.descriptionLocalized,
              i18n.language,
            )}
          </Typography>

          {section.sources.length > 0 ? (
            <div className="mt-3 space-y-2">
              {section.sources.map((source, sourceIndex) => (
                <SectionSourceItem
                  key={source.id}
                  directoryId={directoryId}
                  sectionId={section.id}
                  source={source}
                  sourceIndex={sourceIndex}
                  sectionName={sectionName}
                  canMoveUp={sourceIndex > 0}
                  canMoveDown={sourceIndex < section.sources.length - 1}
                  isMutating={isMutatingSources}
                  isExpanded={isSourceExpanded(source.id)}
                  onToggleExpand={() => onToggleSourceExpand(source.id)}
                  onMoveSource={(sourceId, direction) =>
                    onMoveSource(section.id, sourceId, direction)
                  }
                  onDeleteSource={(sourceId) =>
                    onDeleteSource(section.id, sourceId)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-dashed p-3 text-center">
              <Typography
                as="p"
                variant="paragraph"
                size="sm"
                textColor="secondary"
              >
                {t('no_sources', { ns: 'page-directories' })}
              </Typography>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" className="h-9">
                  <Link href={searchHref}>{t('go_to_search_results')}</Link>
                </Button>
                <Button asChild variant="outline" className="h-9">
                  <Link href={favoritesHref}>{t('go_to_favorites_list')}</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
