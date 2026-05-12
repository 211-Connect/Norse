'use client';

import { useRowLabel, useWatchForm } from '@payloadcms/ui';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';

const FacetsRowLabel = ({ path }) => {
  const { rowNumber } = useRowLabel();
  const { getDataByPath } = useWatchForm();

  const arrayData = getDataByPath(path);

  const data = rowNumber === undefined ? {} : arrayData?.[rowNumber] || {};

  return <ArrayRowLabel rowNumber={rowNumber} title={data.name} />;
};

export default FacetsRowLabel;
