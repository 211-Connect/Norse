'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { deletePrintableDirectorySectionSource } from '@/app/(app)/shared/serverActions/printableDirectories/deletePrintableDirectorySectionSource';
import { createPrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySection';
import { reorderPrintableDirectorySections } from '@/app/(app)/shared/serverActions/printableDirectories/reorderPrintableDirectorySections';
import { reorderPrintableDirectorySectionSources } from '@/app/(app)/shared/serverActions/printableDirectories/reorderPrintableDirectorySectionSources';
import { updatePrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectorySection';
import {
  PrintableDirectoryResponseDto,
  PrintableDirectorySectionResponseDto,
} from '@/lib/api/generated/data-contracts';

import { toLocalizedValues } from '../../utils/toLocalizedValues';
import { SectionDialogValues } from '../../utils/dialog-types';
import { SectionDialog } from './section-dialog';
import { SectionsCard } from './sections-card';
import { DEFAULT_MAX_RESOURCES } from '../../utils/constants';

type SectionsEditorCardProps = {
  directory: PrintableDirectoryResponseDto;
  onDirectoryUpdated: (directory: PrintableDirectoryResponseDto) => void;
};

const cloneSections = (sections: PrintableDirectorySectionResponseDto[]) =>
  sections.map((section) => ({
    ...section,
    sources: section.sources.map((source) => ({ ...source })),
  }));

export function SectionsEditorCard({
  directory,
  onDirectoryUpdated,
}: SectionsEditorCardProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isMutatingSources, setIsMutatingSources] = useState(false);
  const [optimisticSections, setOptimisticSections] = useState<
    PrintableDirectorySectionResponseDto[] | null
  >(null);

  const sections = optimisticSections ?? directory.sections;

  const editingSection = useMemo(
    () => sections.find((section) => section.id === editingSectionId),
    [sections, editingSectionId],
  );

  const handleCreateSection = async (values: SectionDialogValues) => {
    setIsSubmitting(true);

    try {
      const updated = await createPrintableDirectorySection(
        directory.id,
        {
          headingLocalized: values.headingLocalized,
          descriptionLocalized: values.descriptionLocalized,
          maxResources: values.maxResources,
        },
        appConfig.tenantId,
      );

      if (!updated) {
        toast.error(t('unable_to_create_section', { ns: 'page-directories' }));
        return;
      }

      onDirectoryUpdated(updated);
      setOptimisticSections(null);
      setIsCreateOpen(false);
      toast.success(t('section_created', { ns: 'page-directories' }));
    } catch {
      toast.error(t('unable_to_create_section', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSection = async (values: SectionDialogValues) => {
    if (!editingSection) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updatePrintableDirectorySection(
        { id: directory.id, sectionId: editingSection.id },
        {
          headingLocalized: values.headingLocalized,
          descriptionLocalized: values.descriptionLocalized,
          maxResources: values.maxResources,
        },
        appConfig.tenantId,
      );

      if (!updated) {
        toast.error(t('unable_to_update_section', { ns: 'page-directories' }));
        return;
      }

      onDirectoryUpdated(updated);
      setOptimisticSections(null);
      setEditingSectionId(null);
      toast.success(t('section_updated', { ns: 'page-directories' }));
    } catch {
      toast.error(t('unable_to_update_section', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveSection = async (
    sectionId: string,
    direction: 'up' | 'down',
  ) => {
    if (isReordering) {
      return;
    }

    const index = sections.findIndex((section) => section.id === sectionId);
    if (index === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) {
      return;
    }

    const previous = cloneSections(sections);
    const reordered = cloneSections(sections);
    const [moved] = reordered.splice(index, 1);
    if (!moved) {
      return;
    }
    reordered.splice(targetIndex, 0, moved);

    const reorderedWithOrder = reordered.map((section, order) => ({
      ...section,
      order,
    }));

    setOptimisticSections(reorderedWithOrder);
    setIsReordering(true);

    try {
      const updated = await reorderPrintableDirectorySections(
        directory.id,
        reorderedWithOrder.map((section) => section.id),
        appConfig.tenantId,
      );

      if (!updated) {
        setOptimisticSections(previous);
        toast.error(
          t('unable_to_reorder_sections', { ns: 'page-directories' }),
        );
        return;
      }

      onDirectoryUpdated(updated);
      setOptimisticSections(null);
      toast.success(
        t('sections_reordered', {
          ns: 'page-directories',
        }),
      );
    } catch {
      setOptimisticSections(previous);
      toast.error(t('unable_to_reorder_sections', { ns: 'page-directories' }));
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveSource = async (
    sectionId: string,
    sourceId: string,
    direction: 'up' | 'down',
  ) => {
    if (isMutatingSources) {
      return;
    }

    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const sourceIndex = section.sources.findIndex(
      (source) => source.id === sourceId,
    );
    if (sourceIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.sources.length) {
      return;
    }

    const previous = cloneSections(sections);
    const reorderedSections = cloneSections(sections);
    const targetSection = reorderedSections.find(
      (item) => item.id === sectionId,
    );

    if (!targetSection) {
      return;
    }

    const [moved] = targetSection.sources.splice(sourceIndex, 1);
    if (!moved) {
      return;
    }

    targetSection.sources.splice(targetIndex, 0, moved);
    targetSection.sources = targetSection.sources.map((source, order) => ({
      ...source,
      order,
    }));

    setOptimisticSections(reorderedSections);
    setIsMutatingSources(true);

    try {
      const updated = await reorderPrintableDirectorySectionSources(
        directory.id,
        sectionId,
        targetSection.sources.map((source) => source.id),
        appConfig.tenantId,
      );

      if (!updated) {
        setOptimisticSections(previous);
        toast.error(
          t('unable_to_reorder_sources', {
            ns: 'page-directories',
            defaultValue: 'Unable to reorder sources',
          }),
        );
        return;
      }

      onDirectoryUpdated(updated);
      setOptimisticSections(null);
      toast.success(
        t('sources_reordered', {
          ns: 'page-directories',
          defaultValue: 'Sources reordered',
        }),
      );
    } catch {
      setOptimisticSections(previous);
      toast.error(
        t('unable_to_reorder_sources', {
          ns: 'page-directories',
          defaultValue: 'Unable to reorder sources',
        }),
      );
    } finally {
      setIsMutatingSources(false);
    }
  };

  const handleDeleteSource = async (sectionId: string, sourceId: string) => {
    if (isMutatingSources) {
      return;
    }

    const section = sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const previous = cloneSections(sections);
    const nextSections = cloneSections(sections).map((item) => {
      if (item.id !== sectionId) {
        return item;
      }

      return {
        ...item,
        sources: item.sources
          .filter((source) => source.id !== sourceId)
          .map((source, order) => ({ ...source, order })),
      };
    });

    setOptimisticSections(nextSections);
    setIsMutatingSources(true);

    try {
      const updated = await deletePrintableDirectorySectionSource(
        directory.id,
        sectionId,
        sourceId,
        appConfig.tenantId,
      );

      if (!updated) {
        setOptimisticSections(previous);
        toast.error(
          t('unable_to_delete_source', {
            ns: 'page-directories',
            defaultValue: 'Unable to delete source',
          }),
        );
        return;
      }

      onDirectoryUpdated(updated);
      setOptimisticSections(null);
      toast.success(
        t('source_deleted', {
          ns: 'page-directories',
          defaultValue: 'Source deleted',
        }),
      );
    } catch {
      setOptimisticSections(previous);
      toast.error(
        t('unable_to_delete_source', {
          ns: 'page-directories',
          defaultValue: 'Unable to delete source',
        }),
      );
    } finally {
      setIsMutatingSources(false);
    }
  };

  return (
    <>
      <SectionsCard
        directoryId={directory.id}
        sections={sections}
        isReorderingSections={isReordering}
        isMutatingSources={isMutatingSources}
        onAddSection={() => setIsCreateOpen(true)}
        onEditSection={setEditingSectionId}
        onMoveSection={handleMoveSection}
        onMoveSource={handleMoveSource}
        onDeleteSource={handleDeleteSource}
      />

      <SectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        isSubmitting={isSubmitting}
        title={t('add_section', { ns: 'page-directories' })}
        submitLabel={t('call_to_action.create', { ns: 'common' })}
        defaultMaxResources={
          appConfig.printableDirectories.defaultMaxResources ??
          DEFAULT_MAX_RESOURCES
        }
        maxResourcesConfigurable={
          appConfig.printableDirectories.maxResourcesConfigurable
        }
        onSubmit={handleCreateSection}
      />

      {editingSection ? (
        <SectionDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditingSectionId(null);
            }
          }}
          isSubmitting={isSubmitting}
          title={t('edit_section', { ns: 'page-directories' })}
          submitLabel={t('call_to_action.save', { ns: 'common' })}
          defaultMaxResources={
            appConfig.printableDirectories.defaultMaxResources ??
            DEFAULT_MAX_RESOURCES
          }
          maxResourcesConfigurable={
            appConfig.printableDirectories.maxResourcesConfigurable
          }
          initialValues={{
            headingLocalized: toLocalizedValues(
              editingSection.headingLocalized,
            ),
            descriptionLocalized: toLocalizedValues(
              editingSection.descriptionLocalized,
            ),
            maxResources: editingSection.maxResources,
          }}
          onSubmit={handleUpdateSection}
        />
      ) : null}
    </>
  );
}
