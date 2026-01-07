'use client';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';
import { useLocale, useRowLabel, useWatchForm } from '@payloadcms/ui';
import { useTopicsEnglish } from './TopicsEnglishContext';

const TopicsRowLabel = (props) => {
  const { path } = props;
  const { rowNumber } = useRowLabel();
  const { getDataByPath } = useWatchForm();
  const locale = useLocale();
  const { englishTopics } = useTopicsEnglish();

  const arrayData = getDataByPath(path);
  const data = rowNumber === undefined ? {} : arrayData?.[rowNumber] || {};

  const localizedName = data.name;
  const isEnglish = locale.code === 'en';
  const parentId = data.id;

  // Get English name from the context (pre-fetched data)
  const englishName =
    parentId && englishTopics[parentId] ? englishTopics[parentId] : null;

  return (
    <ArrayRowLabel
      rowNumber={rowNumber}
      title={localizedName}
      englishTitle={!isEnglish && !localizedName ? englishName : undefined}
    />
  );
};

export default TopicsRowLabel;
