'use client';

import { DefaultEditView } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import { EnglishDataProvider } from './EnglishDataContext';

const EditViewWrapper = (props: any) => {
  const [rdId, setRdId] = useState<string>('');

  useEffect(() => {
    // Extract resource directory ID from URL or props
    const urlParts = window.location.pathname.split('/');
    const id = urlParts[urlParts.length - 1];
    setRdId(id);
  }, []);

  return (
    <EnglishDataProvider resourceDirectoryId={rdId}>
      <DefaultEditView {...props} />
    </EnglishDataProvider>
  );
};

export default EditViewWrapper;
