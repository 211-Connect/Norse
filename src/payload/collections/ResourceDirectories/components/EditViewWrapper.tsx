'use client';

import { DefaultEditView } from '@payloadcms/ui';
import { TopicsEnglishProvider } from './TopicsEnglishContext';
import { useEffect, useState } from 'react';

const EditViewWrapper = (props: any) => {
  const [rdId, setRdId] = useState<string>('');

  useEffect(() => {
    // Extract resource directory ID from URL or props
    const urlParts = window.location.pathname.split('/');
    const id = urlParts[urlParts.length - 1];
    setRdId(id);
  }, []);

  return (
    <TopicsEnglishProvider resourceDirectoryId={rdId}>
      <DefaultEditView {...props} />
    </TopicsEnglishProvider>
  );
};

export default EditViewWrapper;
