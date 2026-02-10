import { ResourceDirectory } from '@/payload/payload-types';

export type SearchConfig = {
  primaryColor: string;
  borderRadius: string;
  domain: string;
  texts: ResourceDirectory['search']['texts'];
  resultsLimit: number;
  radiusSelectValues: number[];
  defaultRadius: number;
  suggestions: ResourceDirectory['suggestions'];
  subtopics: {
    name: string;
    topicName: string;
    queryType: 'link' | 'text' | 'taxonomy';
    query: string | null;
    openInNewTab: boolean | null;
    href: string | null;
  }[];
};
