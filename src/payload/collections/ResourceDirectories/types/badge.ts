import { ResourceDirectory } from '@/payload/payload-types';

export type ResourceDirectoryBadgeListItem = NonNullable<
  NonNullable<ResourceDirectory['badges']>['list']
>[number];
