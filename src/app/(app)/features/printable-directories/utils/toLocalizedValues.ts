import {
  PrintableDirectoryLocalizedTextResponseDto,
  PrintableDirectoryLocalizedValuesDto,
} from '@/lib/api/generated/data-contracts';

export const toLocalizedValues = (
  value?: PrintableDirectoryLocalizedTextResponseDto,
): PrintableDirectoryLocalizedValuesDto => ({
  values: value?.values ?? {},
});
