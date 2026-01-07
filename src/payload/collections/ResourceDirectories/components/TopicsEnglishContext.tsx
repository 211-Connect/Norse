'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useLocale } from '@payloadcms/ui';

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
        const response = await fetch(
          `/api/resource-directories/${resourceDirectoryId}?locale=en&depth=2`,
          {
            credentials: 'include',
          },
        );

        if (response.ok) {
          const rdData = await response.json();
          const topics = rdData.topics?.list || [];
          const englishMap: Record<string, string> = {};

          // Map all topic and subtopic IDs to their English names
          topics.forEach((topic: any) => {
            if (topic.id && topic.name) {
              englishMap[topic.id] = topic.name;
            }

            topic.subtopics?.forEach((subtopic: any) => {
              if (subtopic.id && subtopic.name) {
                englishMap[subtopic.id] = subtopic.name;
              }
            });
          });

          setEnglishTopics(englishMap);
        }
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
