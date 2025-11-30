'use client';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';
import { useRowLabel, useWatchForm } from '@payloadcms/ui';

const SuggestionsRowLabel = ({ path }) => {
  const { rowNumber } = useRowLabel();
  const { getDataByPath } = useWatchForm();

  const arrayData = getDataByPath(path);

  const data = rowNumber === undefined ? {} : arrayData?.[rowNumber] || {};

  return <ArrayRowLabel rowNumber={rowNumber} title={data.value} />;
};

export default SuggestionsRowLabel;
