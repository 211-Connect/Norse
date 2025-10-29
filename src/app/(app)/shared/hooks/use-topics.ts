'use client';

import { useAppConfig } from './use-app-config';

export type SubTopic = {
  name: string;
  href?: string;
  query?: string;
  queryType?: string;
};

export type Topic = {
  name: string;
  href?: string;
  image?: string;
  subtopics?: SubTopic[];
};

export function useTopics() {
  const appConfig = useAppConfig();
  return appConfig.topics?.list;
}
