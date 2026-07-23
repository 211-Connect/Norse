import { ResourceLayout } from '@/types/printableDirectories';
import { TFunction } from 'i18next';

const RESOURCE_LAYOUT_LABELS: Record<ResourceLayout, string> = {
  line: 'resource_layout_name.line',
  summary: 'resource_layout_name.summary',
  full: 'resource_layout_name.full',
  'custom-search': 'resource_layout_name.custom_search',
  'custom-resource': 'resource_layout_name.custom_resource',
};

export const getResourceLayoutLabel = (
  resourceLayout: ResourceLayout,
  t: TFunction,
) => {
  return t(RESOURCE_LAYOUT_LABELS[resourceLayout], { ns: 'page-directories' });
};
