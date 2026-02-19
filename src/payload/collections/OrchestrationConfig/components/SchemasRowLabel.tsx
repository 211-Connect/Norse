'use client';

import LocalizedRowLabel from '@/payload/collections/ResourceDirectories/components/LocalizedRowLabel';

const SchemasRowLabel = ({ path }) => {
  return <LocalizedRowLabel path={path} localizedFieldKey="schemaName" />;
};

export default SchemasRowLabel;
