import type { SelectFieldSingleValidation } from 'payload';
import { select } from 'payload/shared';

export const SUBTOPIC_QUERY_TYPE_REQUIRED = 'Choose a query type';

/**
 * A subtopic needs a query type: without one its topic card links to `query_type=` with no query, which
 * searches nothing (ISS-2405). Subtopics with an href are the exception: they predate the `link` option
 * (added 2025-12), and the card follows the href, so they work without a type.
 *
 * Enforced on save rather than with `required`, so the column stays nullable and existing subtopics need no
 * migration; editors fix the broken ones the next time they save.
 */
export const validateSubtopicQueryType: SelectFieldSingleValidation = (
  value,
  args,
) => {
  if (value) return select(value, args);
  const href = (args.siblingData as { href?: unknown } | undefined)?.href;
  return typeof href === 'string' && href.trim()
    ? true
    : SUBTOPIC_QUERY_TYPE_REQUIRED;
};
