'use client';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  Trash2Icon,
  TriangleAlert,
} from 'lucide-react';
import qs from 'qs';
import { useTranslation } from 'react-i18next';

import { Link } from '@/app/(app)/shared/components/link';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { PrintableDirectorySourceResponseDto } from '@/lib/api/generated/data-contracts';

type SectionSourceItemProps = {
  directoryId: string;
  sectionId: string;
  source: PrintableDirectorySourceResponseDto;
  sourceIndex: number;
  sectionName: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isMutating: boolean;
  onMoveSource: (sourceId: string, direction: 'up' | 'down') => void;
  onDeleteSource: (sourceId: string) => void;
};

const formatQueryParamValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
};

const DEFAULT_QUERY_OVERRIDE_KEYS = new Set(['coords', 'location', 'distance']);

export function SectionSourceItem({
  directoryId,
  sectionId,
  source,
  sourceIndex,
  sectionName,
  canMoveUp,
  canMoveDown,
  isMutating,
  onMoveSource,
  onDeleteSource,
}: SectionSourceItemProps) {
  const { t } = useTranslation('page-directories');

  const queryParamsEntries = Object.entries(source.query?.params ?? {});
  const searchHref =
    source.type === 'query' && source.query?.params
      ? `/search?${qs.stringify(
          {
            ...(source.query.params as Record<string, unknown>),
            pdid: directoryId,
            pdsid: sectionId,
          },
          {
            arrayFormat: 'indices',
            encodeValuesOnly: true,
          },
        )}`
      : '';
  const favoriteListHref =
    source.type === 'favorites_list' && source.favoriteList?.id
      ? `/favorites/${source.favoriteList.id}`
      : '';
  const sourceTypeLabel = t(`source_type_name.${source.type}`, {
    defaultValue: source.type,
  });
  const sourceCount = source.resources.length;
  const favoriteListCount = source.favoriteList?.count ?? 0;

  return (
    <div className="rounded-md border border-dashed p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Typography as="p" variant="heading" size="sm">
              {`${t('source_label')}: ${sourceIndex + 1}`}
            </Typography>
            <Typography as="p" variant="paragraph" size="sm">
              ({sourceTypeLabel})
            </Typography>
          </div>

          {source.type === 'query' ? (
            <>
              <Typography as="p" variant="paragraph" size="sm">
                <span className="font-medium">{t('title_label')}:</span>{' '}
                {source.query?.title || '-'}
              </Typography>
              {queryParamsEntries.length > 0 ? (
                <div className="text-sm break-all">
                  <span className="font-medium">
                    {t('query_params_label')}:
                  </span>
                  <div className="mt-1 space-y-1">
                    {queryParamsEntries.map(([key, value]) => {
                      return (
                        <p key={key} className="break-all pl-4 text-sm">
                          <span className="font-medium">{key}</span>
                          {DEFAULT_QUERY_OVERRIDE_KEYS.has(key) ? (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 inline-flex align-text-bottom">
                                    <TriangleAlert
                                      className="size-4 text-amber-500"
                                      aria-label={t(
                                        'query_param_overrides_default_location',
                                        {
                                          defaultValue:
                                            'This query parameter overrides the default location configuration',
                                        },
                                      )}
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('query_param_overrides_default_location', {
                                    defaultValue:
                                      'This query parameter overrides the default location configuration',
                                  })}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}
                          {': '}
                          {formatQueryParamValue(value)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Typography
                  as="p"
                  variant="paragraph"
                  size="sm"
                  className="break-all"
                >
                  <span className="font-medium">
                    {t('query_params_label')}:
                  </span>{' '}
                  -
                </Typography>
              )}
            </>
          ) : null}

          {source.type === 'favorites_list' ? (
            <>
              <Typography as="p" variant="paragraph" size="sm">
                <span className="font-medium">
                  {t('favorites_list_label')}:
                </span>{' '}
                {source.favoriteList?.name || '-'}
              </Typography>
              <Typography as="p" variant="paragraph" size="sm">
                <span className="font-medium">{t('items_count_label')}:</span>{' '}
                {favoriteListCount}
              </Typography>
            </>
          ) : null}

          {source.type === 'resource_ids' ? (
            <>
              <Typography
                as="p"
                variant="paragraph"
                size="sm"
                className="break-all"
              >
                <span className="font-medium">{t('resource_ids_label')}:</span>{' '}
                {source.resources.length > 0
                  ? source.resources.map((resource) => resource.name).join(', ')
                  : '-'}
              </Typography>
              <Typography as="p" variant="paragraph" size="sm">
                <span className="font-medium">{t('items_count_label')}:</span>{' '}
                {sourceCount}
              </Typography>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {source.type === 'query' && searchHref ? (
            <Button asChild variant="outline" className="h-9">
              <Link href={searchHref}>{t('go_to_search_results')}</Link>
            </Button>
          ) : null}

          {source.type === 'favorites_list' && favoriteListHref ? (
            <Button asChild variant="outline" className="h-9">
              <Link href={favoriteListHref}>{t('go_to_favorites_list')}</Link>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSource(source.id, 'up')}
            disabled={isMutating || !canMoveUp}
            aria-label={`Move source ${sourceIndex + 1} up in ${sectionName}`}
          >
            <ArrowUpIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMoveSource(source.id, 'down')}
            disabled={isMutating || !canMoveDown}
            aria-label={`Move source ${sourceIndex + 1} down in ${sectionName}`}
          >
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onDeleteSource(source.id)}
            disabled={isMutating}
            aria-label={`Delete source ${sourceIndex + 1} from ${sectionName}`}
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
