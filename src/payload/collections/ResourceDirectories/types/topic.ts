import { ResourceDirectory } from '@/payload/payload-types';

export type ResourceDirectoryTopicListItem = NonNullable<
  NonNullable<ResourceDirectory['topics']>['list']
>[number];
