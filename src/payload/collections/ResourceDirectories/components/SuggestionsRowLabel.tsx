'use client';

import LocalizedRowLabel from './LocalizedRowLabel';

const SuggestionsRowLabel = ({ path }) => {
  return <LocalizedRowLabel path={path} localizedFieldKey="value" />;
};

export default SuggestionsRowLabel;
