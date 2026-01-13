'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useLocale } from '@payloadcms/ui';
import { getEnglishTopics } from '../actions/getEnglishTopics';

interface TopicsEnglishContextType {
  englishTopics: Record<string, string>;
  loading: boolean;
}

const TopicsEnglishContext = createContext<TopicsEnglishContextType>({
  englishTopics: {},
  loading: false,
});

export const useTopicsEnglish = () => useContext(TopicsEnglishContext);

interface TopicsEnglishProviderProps {
  children: ReactNode;
  resourceDirectoryId?: string;
}

export const TopicsEnglishProvider = ({
  children,
  resourceDirectoryId,
}: TopicsEnglishProviderProps) => {
  const locale = useLocale();
  const [englishTopics, setEnglishTopics] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isEnglish = locale.code === 'en';

    if (isEnglish || !resourceDirectoryId) {
      setEnglishTopics({});
      return;
    }

    const fetchEnglishTopics = async () => {
      setLoading(true);
      try {
        const englishMap = await getEnglishTopics(resourceDirectoryId);
        setEnglishTopics(englishMap);
      } catch (error) {
        console.error('Failed to fetch English topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnglishTopics();
  }, [locale.code, resourceDirectoryId]);

  return (
    <TopicsEnglishContext.Provider value={{ englishTopics, loading }}>
      {children}
    </TopicsEnglishContext.Provider>
  );
};
