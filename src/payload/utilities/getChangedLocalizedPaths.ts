import { get } from 'radash';
import { ResourceDirectory } from '../payload-types';
import { ResourceDirectoryTopicListItem } from '../collections/ResourceDirectories/types/topic';
import { ResourceDirectorySuggestionListItem } from '../collections/ResourceDirectories/types/suggestion';
import { ResourceDirectoryBadgeListItem } from '../collections/ResourceDirectories/types/badge';

interface ChangeDetail {
  path: string;
  before: any;
  after: any;
}

export const AUTO_TRANSLATED_STRING_PATHS = [
  'topics.backText',
  'topics.customHeading',
  'search.texts.title',
  'search.texts.queryInputPlaceholder',
  'search.texts.locationInputPlaceholder',
  'search.texts.noResultsFallbackText',
];

function deepLocalizedDiff(
  before: ResourceDirectory,
  after: ResourceDirectory,
): ChangeDetail[] {
  const changes: ChangeDetail[] = [];

  if (!before || !after) {
    return changes;
  }

  AUTO_TRANSLATED_STRING_PATHS.forEach((path) => {
    if (get(before, path) !== get(after, path)) {
      changes.push({
        path,
        before: get(before, path),
        after: get(after, path),
      });
    }
  });

  // TOPICS

  const beforeTopics: ResourceDirectoryTopicListItem[] = get(
    before,
    'topics.list',
    [],
  );
  const afterTopics: ResourceDirectoryTopicListItem[] = get(
    after,
    'topics.list',
    [],
  );

  const beforeTopicsMap = new Map(
    beforeTopics.map((topic) => [topic.id, topic]),
  );
  const afterTopicsMap = new Map(afterTopics.map((topic) => [topic.id, topic]));

  afterTopics.forEach((afterTopic, index) => {
    const beforeTopic = beforeTopicsMap.get(afterTopic.id);

    if (!beforeTopic) {
      changes.push({
        path: `topics.list.${index}.name`,
        before: undefined,
        after: afterTopic.name,
      });
    } else if (beforeTopic.name !== afterTopic.name) {
      changes.push({
        path: `topics.list.${index}.name`,
        before: beforeTopic.name,
        after: afterTopic.name,
      });
    }

    const beforeSubtopics = beforeTopic?.subtopics || [];
    const afterSubtopics = afterTopic?.subtopics || [];

    const beforeSubtopicsMap = new Map(
      beforeSubtopics.map((st) => [st.id, st]),
    );
    const afterSubtopicsMap = new Map(afterSubtopics.map((st) => [st.id, st]));

    afterSubtopics.forEach((afterSubtopic, subIndex: number) => {
      const beforeSubtopic = beforeSubtopicsMap.get(afterSubtopic.id);

      if (!beforeSubtopic) {
        changes.push({
          path: `topics.list.${index}.subtopics.${subIndex}.name`,
          before: undefined,
          after: afterSubtopic.name,
        });
      } else if (beforeSubtopic.name !== afterSubtopic.name) {
        changes.push({
          path: `topics.list.${index}.subtopics.${subIndex}.name`,
          before: beforeSubtopic.name,
          after: afterSubtopic.name,
        });
      }
    });

    beforeSubtopics.forEach((beforeSubtopic, subIndex: number) => {
      if (!afterSubtopicsMap.has(beforeSubtopic.id)) {
        changes.push({
          path: `topics.list.${index}.subtopics.${subIndex}.name`,
          before: beforeSubtopic.name,
          after: undefined,
        });
      }
    });
  });

  beforeTopics.forEach((beforeTopic, index) => {
    if (!afterTopicsMap.has(beforeTopic.id)) {
      changes.push({
        path: `topics.list.${index}.name`,
        before: beforeTopic.name,
        after: undefined,
      });
    }
  });

  // SUGGESTIONS

  const beforeSuggestions: ResourceDirectorySuggestionListItem[] = get(
    before,
    'suggestions',
    [],
  );
  const afterSuggestions: ResourceDirectorySuggestionListItem[] = get(
    after,
    'suggestions',
    [],
  );

  const beforeSuggestionsMap = new Map(beforeSuggestions.map((s) => [s.id, s]));
  const afterSuggestionsMap = new Map(afterSuggestions.map((s) => [s.id, s]));

  afterSuggestions.forEach((afterSuggestion, index) => {
    const beforeSuggestion = beforeSuggestionsMap.get(afterSuggestion.id);

    if (!beforeSuggestion) {
      changes.push({
        path: `suggestions.${index}.value`,
        before: undefined,
        after: afterSuggestion.value,
      });
    } else if (beforeSuggestion.value !== afterSuggestion.value) {
      changes.push({
        path: `suggestions.${index}.value`,
        before: beforeSuggestion.value,
        after: afterSuggestion.value,
      });
    }
  });

  beforeSuggestions.forEach((beforeSuggestion, index) => {
    if (!afterSuggestionsMap.has(beforeSuggestion.id)) {
      changes.push({
        path: `suggestions.${index}.value`,
        before: beforeSuggestion.value,
        after: undefined,
      });
    }
  });

  // BADGES

  const beforeBadges: ResourceDirectoryBadgeListItem[] = get(
    before,
    'badges.list',
    [],
  );
  const afterBadges: ResourceDirectoryBadgeListItem[] = get(
    after,
    'badges.list',
    [],
  );

  const beforeBadgesMap = new Map(beforeBadges.map((b) => [b.id, b]));
  const afterBadgesMap = new Map(afterBadges.map((b) => [b.id, b]));

  afterBadges.forEach((afterBadge, index) => {
    const beforeBadge = beforeBadgesMap.get(afterBadge.id);

    (['badgeLabel', 'tooltip'] as const).forEach((field) => {
      if (!beforeBadge) {
        if (afterBadge[field]) {
          changes.push({
            path: `badges.list.${index}.${field}`,
            before: undefined,
            after: afterBadge[field],
          });
        }
      } else if (beforeBadge[field] !== afterBadge[field]) {
        changes.push({
          path: `badges.list.${index}.${field}`,
          before: beforeBadge[field],
          after: afterBadge[field],
        });
      }
    });
  });

  beforeBadges.forEach((beforeBadge, index) => {
    if (!afterBadgesMap.has(beforeBadge.id)) {
      (['badgeLabel', 'tooltip'] as const).forEach((field) => {
        if (beforeBadge[field]) {
          changes.push({
            path: `badges.list.${index}.${field}`,
            before: beforeBadge[field],
            after: undefined,
          });
        }
      });
    }
  });

  // SEARCH FACETS

  const beforeFacets: NonNullable<ResourceDirectory['search']['facets']> = get(
    before,
    'search.facets',
    [],
  );
  const afterFacets: NonNullable<ResourceDirectory['search']['facets']> = get(
    after,
    'search.facets',
    [],
  );

  const beforeFacetsMap = new Map(beforeFacets.map((f) => [f.id, f]));
  const afterFacetsMap = new Map(afterFacets.map((f) => [f.id, f]));

  afterFacets.forEach((afterFacet, index) => {
    const beforeFacet = beforeFacetsMap.get(afterFacet.id);

    if (!beforeFacet) {
      changes.push({
        path: `search.facets.${index}.name`,
        before: undefined,
        after: afterFacet.name,
      });
    } else if (beforeFacet.name !== afterFacet.name) {
      changes.push({
        path: `search.facets.${index}.name`,
        before: beforeFacet.name,
        after: afterFacet.name,
      });
    }
  });

  beforeFacets.forEach((beforeFacet, index) => {
    if (!afterFacetsMap.has(beforeFacet.id)) {
      changes.push({
        path: `search.facets.${index}.name`,
        before: beforeFacet.name,
        after: undefined,
      });
    }
  });

  return changes;
}

export function getChangedLocalizedPaths(
  before: ResourceDirectory,
  after: ResourceDirectory,
): string[] {
  const changes = deepLocalizedDiff(before, after);
  return changes.map((change) => change.path);
}
