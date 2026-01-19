import { useLocale, useRowLabel, useWatchForm } from '@payloadcms/ui';
import { useEnglishData } from './EnglishDataContext';

interface UseLocalizedRowLabelParams {
  path: string;
  localizedFieldKey: string;
}

interface LocalizedRowLabelData {
  rowNumber: number | undefined;
  localizedValue: string | undefined;
  englishValue: string | null;
}

export function useLocalizedRowLabel({
  path,
  localizedFieldKey,
}: UseLocalizedRowLabelParams): LocalizedRowLabelData {
  const { rowNumber } = useRowLabel();
  const { getDataByPath } = useWatchForm();
  const locale = useLocale();
  const { englishData } = useEnglishData();

  const arrayData = getDataByPath(path);
  const data = rowNumber === undefined ? {} : arrayData?.[rowNumber] || {};

  const localizedValue = data[localizedFieldKey];
  const isEnglish = locale.code === 'en';
  const itemId = data.id;

  const englishValue =
    !isEnglish && itemId && englishData[itemId] ? englishData[itemId] : null;

  return {
    rowNumber,
    localizedValue,
    englishValue,
  };
}
