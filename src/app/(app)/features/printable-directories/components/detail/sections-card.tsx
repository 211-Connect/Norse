'use client';

import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { PrintableDirectorySectionResponseDto } from '@/lib/api/generated/data-contracts';

import { getPrintableDirectoryLocalizedText } from '../../utils/getPrintableDirectoryLocalizedText';
import { SectionSourceItem } from './section-source-item';

type SectionsCardProps = {
  directoryId: string;
  sections: PrintableDirectorySectionResponseDto[];
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
  isReorderingSections,
  isMutatingSources,
  onAddSection,
  onEditSection,
  onMoveSection,
  onMoveSource,
  onDeleteSource,
}: SectionsCardProps) {
  const { t, i18n } = useTranslation(['page-directories', 'common']);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 mb-2">
        <CardTitle className="mb-1 text-lg">
          {t('sections_title', { ns: 'page-directories' })}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          className="gap-1"
          onClick={onAddSection}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          {t('add_section', { ns: 'page-directories' })}
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {sections.length === 0 ? (
          <Typography variant="paragraph" size="sm" textColor="secondary">
            {t('no_sections', { ns: 'page-directories' })}
          </Typography>
        ) : (
          sections.map((section, index) => (
            <div key={section.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Typography as="p" variant="heading" size="sm">
                    {index + 1}.{' '}
                    {getPrintableDirectoryLocalizedText(
                      section.headingLocalized,
                      i18n.language,
                    )}
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
                    aria-label={t('move_section_up', {
                      name: getPrintableDirectoryLocalizedText(
                        section.headingLocalized,
                        i18n.language,
                      ),
                    })}
                  >
                    <ArrowUpIcon className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onMoveSection(section.id, 'down')}
                    disabled={
                      isReorderingSections || index === sections.length - 1
                    }
                    aria-label={t('move_section_down', {
                      name: getPrintableDirectoryLocalizedText(
                        section.headingLocalized,
                        i18n.language,
                      ),
                    })}
                  >
                    <ArrowDownIcon className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onEditSection(section.id)}
                    aria-label={t('call_to_action.edit', {
                      ns: 'common',
                    })}
                  >
                    <PencilIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

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
                  {section.sources.map((source, sourceIndex) => {
                    return (
                      <SectionSourceItem
                        key={source.id}
                        directoryId={directoryId}
                        sectionId={section.id}
                        source={source}
                        sourceIndex={sourceIndex}
                        sectionName={getPrintableDirectoryLocalizedText(
                          section.headingLocalized,
                          i18n.language,
                        )}
                        canMoveUp={sourceIndex > 0}
                        canMoveDown={sourceIndex < section.sources.length - 1}
                        isMutating={isMutatingSources}
                        onMoveSource={(sourceId, direction) =>
                          onMoveSource(section.id, sourceId, direction)
                        }
                        onDeleteSource={(sourceId) =>
                          onDeleteSource(section.id, sourceId)
                        }
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
