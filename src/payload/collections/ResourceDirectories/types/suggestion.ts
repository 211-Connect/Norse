import { ResourceDirectory } from '@/payload/payload-types';

export type ResourceDirectorySuggestionListItem = NonNullable<
  ResourceDirectory['suggestions']
>[number];
