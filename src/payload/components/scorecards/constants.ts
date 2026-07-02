import { NeedDefinition } from '@/types/taxonomyScorecard';
import commonEn from '../../../../public/locales/en/common.json';

type CommonNeedsDictionary = Record<
  string,
  {
    name?: string;
    description?: string;
    displayDescription?: string;
  }
>;

export const NEED_DEFINITIONS: NeedDefinition[] = Object.entries(
  ((commonEn as { needs?: CommonNeedsDictionary }).needs ??
    {}) as CommonNeedsDictionary,
)
  .map(([code, value]) => ({
    code,
    name: value.name ?? code,
    description: value.displayDescription ?? '',
  }))
  .sort((left, right) => left.code.localeCompare(right.code));
