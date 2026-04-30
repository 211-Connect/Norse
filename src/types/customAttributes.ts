import { OrchestrationConfig } from '@/payload/payload-types';

export type CustomAttribute = Pick<
  NonNullable<
    NonNullable<
      NonNullable<OrchestrationConfig['schemas']>
    >[number]['customAttributes']
  >[number],
  | 'source_table'
  | 'source_column'
  | 'link_entity'
  | 'provenance'
  | 'searchable'
  | 'id'
  | 'translate_label'
  | 'translate_value'
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
