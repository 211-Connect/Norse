/**
 * Where a request for the admin on a public host goes: the same admin page on
 * the CMS's public host. `adminUrl` is `CMS_ADMIN_URL` (origin plus any base
 * path). It always starts the result and the path is encoded, so a request
 * cannot redirect anywhere else. Without it there is nowhere to send them.
 */
export function getCmsAdminRedirectUrl(
  adminUrl: string | undefined,
  path: string[] = [],
  search = '',
): string | null {
  const base = adminUrl?.replace(/\/+$/, '');
  if (!base) return null;

  const adminPath = ['admin', ...path.map(encodeURIComponent)].join('/');
  return `${base}/${adminPath}${search}`;
}
