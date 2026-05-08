'use client';

import { createLogger } from '@/lib/logger';
import { useLocale } from '@payloadcms/ui';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getEnglishData } from '../actions/getEnglishData';

const log = createLogger('english-data-context');

interface EnglishDataContextType {
  englishData: Record<string, string>;
  loading: boolean;
}

const EnglishDataContext = createContext<EnglishDataContextType>({
  englishData: {},
  loading: false,
});

export const useEnglishData = () => useContext(EnglishDataContext);

interface EnglishDataProviderProps {
  children: ReactNode;
  resourceDirectoryId?: string;
}

export const EnglishDataProvider = ({
  children,
  resourceDirectoryId,
}: EnglishDataProviderProps) => {
  const locale = useLocale();
  const [englishData, setEnglishData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchEnglishData = async (resourceDirectoryId: string) => {
    setLoading(true);
    try {
      const englishMap = await getEnglishData(resourceDirectoryId);
      setEnglishData(englishMap);
    } catch (error) {
      log.error({ err: error }, 'Failed to fetch English data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isEnglish = locale.code === 'en';

    if (isEnglish || !resourceDirectoryId) {
      setEnglishData({});
      return;
    }

    fetchEnglishData(resourceDirectoryId);
  }, [locale.code, resourceDirectoryId]);

  return (
    <EnglishDataContext.Provider value={{ englishData, loading }}>
      {children}
    </EnglishDataContext.Provider>
  );
};
