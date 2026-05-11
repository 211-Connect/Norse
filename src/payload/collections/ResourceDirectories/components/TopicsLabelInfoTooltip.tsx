'use client';

import { useWatchForm } from '@payloadcms/ui';
import type { TextFieldLabelClientComponent } from 'payload';

import LabelInfoTooltip from '@/payload/components/LabelInfoTooltip';

const TopicsLabelInfoTooltip: TextFieldLabelClientComponent = ({
  field,
  path,
}) => {
  const { getDataByPath } = useWatchForm();

  const topicPath = `${path?.replace(/\.query$/, '')}`;

  const topicData: any = getDataByPath(topicPath);
  let customField = {
    ...field!,
  };

  if (customField && topicData?.queryType === 'text') {
    customField.name = 'queryText';
  }

  return <LabelInfoTooltip path={path} field={customField} />;
};

export default TopicsLabelInfoTooltip;
