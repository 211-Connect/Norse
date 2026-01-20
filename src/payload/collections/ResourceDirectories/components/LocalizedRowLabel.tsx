'use client';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';
import { useLocalizedRowLabel } from './useLocalizedRowLabel';

interface LocalizedRowLabelProps {
  path: string;
  localizedFieldKey: string;
}

const LocalizedRowLabel = ({
  path,
  localizedFieldKey,
}: LocalizedRowLabelProps) => {
  const { rowNumber, localizedValue, englishValue } = useLocalizedRowLabel({
    path,
    localizedFieldKey,
  });

  return (
    <ArrayRowLabel
      rowNumber={rowNumber}
      title={localizedValue}
      englishTitle={englishValue}
    />
  );
};

export default LocalizedRowLabel;
