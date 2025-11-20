/**
 * Query types supported by the search API
 */
export const QueryType = {
  TEXT: 'text',
  TAXONOMY: 'taxonomy',
  MORE_LIKE_THIS: 'more_like_this',
} as const;

export type QueryTypeValue = (typeof QueryType)[keyof typeof QueryType];

/**
 * Check if a query type is valid
 */
export function isValidQueryType(type: string): type is QueryTypeValue {
  return Object.values(QueryType).includes(type as QueryTypeValue);
}

/**
 * Determine query type based on search criteria
 */
export function determineQueryType(
  isTaxonomyCode: boolean,
  explicitType?: string,
): QueryTypeValue {
  if (explicitType && isValidQueryType(explicitType)) {
    return explicitType;
  }

  if (isTaxonomyCode) {
    return QueryType.TAXONOMY;
  }

  return undefined;
}
