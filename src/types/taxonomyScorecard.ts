export type NeedWeights = Record<string, number>;

export type TaxonomyScorecardDocument = {
  _id: string;
  hsis_code: string;
  hsis_name?: string;
  scorecard_version?: string;
  taxonomy_version?: string;
  scorecard: TaxonomyScorecard;
  components_available?: string[];
  source: TaxonomyScorecardSource;
  versions?: Record<string, TaxonomyScorecardVersion>;
  version_metadata?: TaxonomyScorecardVersionMetadata;
  updated_at?: string;
};

export type TaxonomyScorecard = {
  need?: TaxonomyNeedScorecard;
  target_population?: unknown | null;
  urgency?: unknown | null;
};

export type TaxonomyNeedScorecard = {
  weights: NeedWeights;
  top_category_code?: string | null;
  top_weight?: number | null;
  need_categories_present?: string[];
};

export type TaxonomyScorecardSource = {
  owner: string;
  customization_version?: string | null;
  isProduction?: boolean;
  published_at?: string | null;
};

export type TaxonomyScorecardVersion = {
  version_id: string;
  scorecard: TaxonomyScorecard;
  source?: TaxonomyScorecardSource;
  created_at: string;
};

export type TaxonomyScorecardVersionMetadata = {
  next_version?: number;
  active_version?: string | null;
  last_action?: 'update' | 'enable';
};

export type SearchTaxonomiesResponse = {
  total: number;
  page: number;
  limit: number;
  items: TaxonomySearchItem[];
};

export type TaxonomySearchItem = {
  code: string;
  name: string;
};

export type GetTaxonomyScorecardResponse = TaxonomyScorecardDocument;

export type UpdateTaxonomyScorecardRequest = {
  weights: NeedWeights;
  include_children?: boolean;
  include_siblings?: boolean;
  draft?: boolean;
};

export type UpdateTaxonomyScorecardResponse = {
  tenant_id: string;
  affected_codes: string[];
  potentially_affected_codes?: string[];
  new_version_count: number;
};

export type EnableTaxonomyScorecardRequest = {
  version_id: number;
};

export type EnableTaxonomyScorecardResponse = {
  document: TaxonomyScorecardDocument;
};

export type NeedDefinition = {
  code: string;
  name: string;
  description: string;
};
