export type TopicSubtopicCache = {
  id?: string;
  name: string;
  names: Record<string, string>;
  queryType?: 'taxonomy' | 'text' | 'link';
  query?: string;
  href?: string;
  target?: '_self' | '_blank';
};

export type TopicCache = {
  id?: string;
  name: string;
  names: Record<string, string>;
  image?: string;
  href?: string;
  target?: '_self' | '_blank';
  subtopics: TopicSubtopicCache[];
};

export type TopicsCache = {
  tenantId: string;
  iconSize: 'small' | 'medium';
  imageBorderRadius: number;
  backText?: string;
  backTexts: Record<string, string>;
  customHeading?: string;
  customHeadings: Record<string, string>;
  list: TopicCache[];
};
