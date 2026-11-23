/**
 * Where a landing-page topic's search can come from (docs/landing-pages.md,
 * Topics): a topic-card subtopic or a search suggestion on the Resource
 * Directory. Pure, used by the admin's Add topics panel and the topic
 * editor's "source changed" warning.
 */

export type SourceKind = 'subtopic' | 'suggestion' | 'custom';

export type TopicSearch = { queryType: 'taxonomy' | 'text'; query: string };

export type TopicSource = {
  kind: Exclude<SourceKind, 'custom'>;
  /** The array row id on the Resource Directory. */
  ref: string;
  label: string;
  /** The topic card a subtopic belongs to. */
  group?: string;
  search: TopicSearch | null;
  /** Why it can't be added, e.g. a link subtopic. */
  disabledReason?: string;
};

type Subtopic = {
  id?: string | null;
  name?: string | null;
  queryType?: string | null;
  query?: string | null;
};
type TopicCard = { name?: string | null; subtopics?: Subtopic[] | null };
type Suggestion = {
  id?: string | null;
  value?: string | null;
  taxonomies?: string | null;
};

/** The parts of a Resource Directory (in the default locale) this reads. */
export type DirectorySources = {
  topics?: { list?: TopicCard[] | null } | null;
  suggestions?: { suggestions?: Suggestion[] | null } | null;
};

export function listTopicSources(directory: DirectorySources): TopicSource[] {
  const subtopics = (directory.topics?.list ?? []).flatMap((card) =>
    (card.subtopics ?? []).flatMap((sub): TopicSource[] => {
      if (!sub.id) return [];
      const queryType = sub.queryType;
      const query = sub.query?.trim();
      const usable =
        (queryType === 'taxonomy' || queryType === 'text') && query;
      return [
        {
          kind: 'subtopic',
          ref: sub.id,
          label: sub.name ?? '',
          group: card.name ?? undefined,
          search: usable ? { queryType, query } : null,
          disabledReason:
            queryType === 'link'
              ? 'Opens a link, not a search'
              : usable
                ? undefined
                : 'Has no search',
        },
      ];
    }),
  );
  const suggestions = (directory.suggestions?.suggestions ?? []).flatMap(
    (s): TopicSource[] => {
      if (!s.id) return [];
      const query = s.taxonomies?.trim();
      return [
        {
          kind: 'suggestion',
          ref: s.id,
          label: s.value ?? '',
          search: query ? { queryType: 'taxonomy', query } : null,
          disabledReason: query ? undefined : 'Has no taxonomy codes',
        },
      ];
    },
  );
  return [...subtopics, ...suggestions];
}

export type SourceStatus =
  | { state: 'custom' }
  | { state: 'missing' }
  | { state: 'unchanged'; source: TopicSource }
  | { state: 'changed'; source: TopicSource; what: ('search' | 'name')[] };

/** How a topic's copied search compares with its source today. */
export function sourceStatus(
  topic: {
    source?: {
      kind?: SourceKind | null;
      ref?: string | null;
      label?: string | null;
    } | null;
    search?: { queryType?: string | null; query?: string | null } | null;
  },
  sources: readonly TopicSource[],
): SourceStatus {
  const kind = topic.source?.kind;
  if (!kind || kind === 'custom') return { state: 'custom' };
  const source = sources.find(
    (s) => s.kind === kind && s.ref === topic.source?.ref,
  );
  if (!source?.search) return { state: 'missing' };
  const what: ('search' | 'name')[] = [];
  if (
    source.search.queryType !== topic.search?.queryType ||
    source.search.query !== topic.search?.query?.trim()
  ) {
    what.push('search');
  }
  if ((topic.source?.label ?? '') !== source.label) what.push('name');
  return what.length
    ? { state: 'changed', source, what }
    : { state: 'unchanged', source };
}
