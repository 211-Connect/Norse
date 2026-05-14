import { ResultType } from '@/app/(app)/shared/store/results';

import { SearchCardCustomAttributeConfig } from '../../types/card-layout-config';

export interface SearchCardComponentProps {
  result: ResultType;
  customAttribute?: SearchCardCustomAttributeConfig | null;
}
