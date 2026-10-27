import { RedirectType, permanentRedirect } from 'next/navigation';

import { rekeyedRedirectTarget } from '@/app/(app)/shared/lib/rekeyedRedirect';

import type { RawSearchParams } from './parseSearchParams';

/**
 * The same `/search` URL with every `organization_id` value equal to the old
 * id replaced by the new one. Every other parameter is kept as it was, in
 * order, repeated keys included: the URL is re-encoded, not re-interpreted,
 * so it applies no search-intent rule of its own. Which value counts as the
 * organization is the reader's call (`parseSearchParams` today, the
 * search-intent lift once that stack lands); the caller passes in the id
 * the reader produced.
 */
export function searchUrlWithOrganization(
  rawParams: RawSearchParams,
  oldOrganizationId: string,
  newOrganizationId: string,
  locale: string,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    for (const item of Array.isArray(value) ? value : [value ?? '']) {
      params.append(
        key,
        key === 'organization_id' && item === oldOrganizationId
          ? newOrganizationId
          : item,
      );
    }
  }
  return `/${locale}/search?${params}`;
}

/** The new organization id from a Norse API 404 for a re-keyed id, or null. */
function rekeyedOrganizationId(err: unknown): string | null {
  const target = rekeyedRedirectTarget(err);
  if (!target) return null;
  const url = new URL(target, 'http://norse.invalid');
  if (url.pathname !== '/search') return null;
  return url.searchParams.get('organization_id') || null;
}

/**
 * An organization-scoped search whose organization id was re-keyed (ISS-2517):
 * 308 to the same search under the new id. Norse-API answers
 * GET /organization/:id for an old id with a tenant-scoped redirect to
 * `/search?organization_id=<new>`. Any other outcome, including a failed
 * lookup, returns without effect, so the search renders as it does today.
 */
export async function redirectIfOrganizationRekeyed({
  organizationId,
  rawParams,
  locale,
  lookup,
}: {
  organizationId: string;
  rawParams: RawSearchParams;
  locale: string;
  lookup: (organizationId: string) => Promise<unknown>;
}): Promise<void> {
  let newOrganizationId: string | null;
  try {
    await lookup(organizationId);
    return;
  } catch (err) {
    newOrganizationId = rekeyedOrganizationId(err);
  }
  if (newOrganizationId && newOrganizationId !== organizationId) {
    permanentRedirect(
      searchUrlWithOrganization(
        rawParams,
        organizationId,
        newOrganizationId,
        locale,
      ),
      RedirectType.replace,
    );
  }
}
