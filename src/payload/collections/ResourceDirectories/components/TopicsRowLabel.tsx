'use client';

import LocalizedRowLabel from './LocalizedRowLabel';

const TopicsRowLabel = ({ path }) => {
  return <LocalizedRowLabel path={path} localizedFieldKey="name" />;
};

export default TopicsRowLabel;
