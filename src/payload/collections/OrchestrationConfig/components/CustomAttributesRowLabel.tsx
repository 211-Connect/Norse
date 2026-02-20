'use client';

import LocalizedRowLabel from '@/payload/collections/ResourceDirectories/components/LocalizedRowLabel';

const CustomAttributesRowLabel = ({ path }) => {
  return <LocalizedRowLabel path={path} localizedFieldKey="label" />;
};

export default CustomAttributesRowLabel;
