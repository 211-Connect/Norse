import { TaxonomySearchItem } from '@/types/taxonomyScorecard';

export type ScorecardsStatusResponse = {
  tenantId: string;
  aiClassificationEnabled: boolean;
};

export type ManagerError = {
  message: string;
};

export type ScorecardsSearchResult = {
  items: TaxonomySearchItem[];
};
