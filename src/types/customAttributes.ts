import { OrchestrationConfig } from '@/payload/payload-types';

export type CustomAttribute = Pick<
  NonNullable<
    NonNullable<
      NonNullable<OrchestrationConfig['schemas']>
    >[number]['customAttributes']
  >[number],
  'source_column' | 'link_entity' | 'provenance' | 'searchable' | 'id'
> & {
  label: {
    [locale: string]: string;
  };
};

export type SchemaConfig = {
  schemaName: string;
  customAttributes: CustomAttribute[];
};

export type OrchestrationConfigCache = {
  tenantId: string;
  schemas: SchemaConfig[];
};
