'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import {
  PrintableDirectoryDefaultQueryConfigDto,
  PrintableDirectorySectionResponseDto,
} from '@/lib/api/generated/data-contracts';

import { useCollapsibleSet } from '../../hooks/use-collapsible-set';
import { SectionItem } from './section-item';

type SectionsCardProps = {
  directoryId: string;
  sections: PrintableDirectorySectionResponseDto[];
  defaultQueryConfig:
    PrintableDirectoryDefaultQueryConfigDto | null | undefined;
  isReorderingSections: boolean;
  isMutatingSources: boolean;
  onAddSection: () => void;
  onEditSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveSource: (
    sectionId: string,
    sourceId: string,
    direction: 'up' | 'down',
  ) => void;
  onDeleteSource: (sectionId: string, sourceId: string) => void;
};

export function SectionsCard({
  directoryId,
  sections,
  defaultQueryConfig,
  isReorderingSections,
  isMutatingSources,
  onAddSection,
  onEditSection,
  onMoveSection,
  onMoveSource,
  onDeleteSource,
}: SectionsCardProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const sectionsCollapsible = useCollapsibleSet();
  const sourcesCollapsible = useCollapsibleSet();

  const handleExpandAll = () => {
    sectionsCollapsible.expandAll();
    sourcesCollapsible.expandAll();
  };

  const handleCollapseAll = () => {
    sectionsCollapsible.collapseAll(sections.map((section) => section.id));
    sourcesCollapsible.collapseAll(
      sections.flatMap((section) => section.sources.map((source) => source.id)),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 mb-2">
        <CardTitle className="mb-1 text-lg">
          {t('sections_title', { ns: 'page-directories' })}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {sections.length > 0 ? (
            <>
              <Button type="button" variant="outline" onClick={handleExpandAll}>
                {t('expand_all', { ns: 'page-directories' })}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCollapseAll}
              >
                {t('collapse_all', { ns: 'page-directories' })}
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={onAddSection}
          >
            <PlusIcon className="size-4" aria-hidden="true" />
            {t('add_section', { ns: 'page-directories' })}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sections.length === 0 ? (
          <Typography variant="paragraph" size="sm" textColor="secondary">
            {t('no_sections', { ns: 'page-directories' })}
          </Typography>
        ) : (
          sections.map((section, index) => (
            <SectionItem
              key={section.id}
              directoryId={directoryId}
              section={section}
              defaultQueryConfig={defaultQueryConfig}
              index={index}
              isLast={index === sections.length - 1}
              isExpanded={sectionsCollapsible.isExpanded(section.id)}
              onToggleExpand={() => sectionsCollapsible.toggle(section.id)}
              isReorderingSections={isReorderingSections}
              isMutatingSources={isMutatingSources}
              onEditSection={onEditSection}
              onMoveSection={onMoveSection}
              isSourceExpanded={sourcesCollapsible.isExpanded}
              onToggleSourceExpand={sourcesCollapsible.toggle}
              onMoveSource={onMoveSource}
              onDeleteSource={onDeleteSource}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
