import { FilterBucket, FiltersMap } from '@/types/search';

export type ActiveFilters = Record<string, string[]>;

export type FacetUiConfig = {
  excludedValues: Map<string, Set<string>>;
  sortModes: Map<string, 'count' | 'name' | 'valueOrder'>;
  customValueOrders: Map<string, string[]>;
};

export type FiltersProps = {
  idPrefix: string;
  filters: FiltersMap;
  filterKeys: string[];
  facetUiConfig: FacetUiConfig;
};

export type FilterOptionRowProps = {
  bucket: FilterBucket;
  checkboxId: string;
  countId: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
  checkboxRef?: (element: HTMLButtonElement | null) => void;
};

export type FilterGroupProps = {
  idPrefix: string;
  facetKey: string;
  heading: string;
  buckets: FilterBucket[];
  excludedForKey?: Set<string>;
  currentFilters: ActiveFilters;
  isPending: boolean;
  onToggle: (facetKey: string, value: string, checked: boolean) => void;
  sortMode: 'count' | 'name' | 'valueOrder';
  customValueOrder?: string[];
};
