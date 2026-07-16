import { PrintableDirectoryLocalizedTextResponseDto } from '@/lib/api/generated/data-contracts';

export const getPrintableDirectoryLocalizedText = (
  value: PrintableDirectoryLocalizedTextResponseDto | undefined,
  locale: string,
): string => {
  if (!value?.values) {
    return '';
  }

  return (
    value.values[locale] ??
    value.values.en ??
    Object.values(value.values)[0] ??
    ''
  );
};
