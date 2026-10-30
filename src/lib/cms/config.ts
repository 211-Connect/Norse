import { getNorseRole } from '@/lib/norse-role';

/**
 * Where the public app gets what lives in the CMS database (tenants, the
 * built app config, translation usage, media). See
 * docs/cms-app-separation-plan.md.
 *
 * - `NORSE_ROLE=cms`: always Payload, in process.
 * - `PAYLOAD_CMS_URL` set (and not the CMS): the CMS internal API over HTTP.
 * - otherwise (`all` without a URL, e.g. local dev): Payload, in process.
 *
 * The public app (`NORSE_ROLE=app`) has no database, so it must have
 * `PAYLOAD_CMS_URL`.
 */
export function isCmsRemote(): boolean {
  const role = getNorseRole();
  if (role === 'cms') return false;
  if (getCmsUrl()) return true;
  if (role === 'app') {
    throw new Error('PAYLOAD_CMS_URL is required when NORSE_ROLE=app');
  }
  return false;
}

/** `PAYLOAD_CMS_URL` without a trailing slash. */
export function getCmsUrl(): string | undefined {
  return process.env.PAYLOAD_CMS_URL?.replace(/\/+$/, '') || undefined;
}

/** Header carrying `CMS_INTERNAL_API_KEY` on every CMS internal API call. */
export const CMS_INTERNAL_API_KEY_HEADER = 'x-internal-api-key';
