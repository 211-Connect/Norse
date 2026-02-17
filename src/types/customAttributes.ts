import { ResourceDirectory } from '@/payload/payload-types';

export type CustomAttribute = Pick<
  NonNullable<
    NonNullable<ResourceDirectory['customAttributes']>['attributes']
  >[number],
  'source_column' | 'link_entity' | 'provenance' | 'searchable' | 'id'
> & {
  label: {
    [locale: string]: string;
  };
};

export type CustomAttributesCache = CustomAttribute[];
