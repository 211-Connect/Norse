import {
  PrintableDirectoryLocalizedTextResponseDto,
  PrintableDirectoryLocalizedValuesDto,
} from '@/lib/api/generated/data-contracts';

/**
 * Response → request shape. Keeps `autoTranslatedLocales`: the API stores
 * exactly what the client sends, so dropping it would mark every machine
 * translation as human-edited.
 */
export const toLocalizedValues = (
  value?: PrintableDirectoryLocalizedTextResponseDto,
): PrintableDirectoryLocalizedValuesDto => ({
  values: value?.values ?? {},
  autoTranslatedLocales: value?.autoTranslatedLocales ?? [],
});
