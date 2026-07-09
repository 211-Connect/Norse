import { ScorecardTaxonomyItemDto } from '@/lib/api/generated/data-contracts';

export type ScorecardsStatusResponse = {
  tenantId: string;
  aiClassificationEnabled: boolean;
};

export type ManagerError = {
  message: string;
};

export type ScorecardsSearchResult = {
  items: ScorecardTaxonomyItemDto[];
};
