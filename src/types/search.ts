export type FilterBucket = {
  key: string;
  display: string;
  doc_count: number;
};

export type FilterEntry = {
  name: string;
  buckets: FilterBucket[];
};

export type FiltersMap = Record<string, FilterEntry>;
