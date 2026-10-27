import { RedirectType, permanentRedirect } from 'next/navigation';

/**
 * The generated Norse API SDK throws the `Response` itself on a non-2xx, with
 * the parsed JSON body on `.error` (src/lib/api/generated/http-client.ts).
 * Not the legacy `FetchError`: nothing on the SDK path throws that.
 */
type SdkErrorResponse = { status: number; error?: unknown };

function asSdkErrorResponse(err: unknown): SdkErrorResponse | null {
  if (!err || typeof err !== 'object') return null;
  const { status } = err as { status?: unknown };
  return typeof status === 'number' ? (err as SdkErrorResponse) : null;
}

export function isNorseApiNotFound(err: unknown): boolean {
  return asSdkErrorResponse(err)?.status === 404;
}

/**
 * Where a re-keyed record went, from a Norse API 404 (ISS-2514), or null.
 * Only a same-site path is accepted: `//host` and `/\host` are protocol-
 * relative to a browser, so an absolute or scheme-relative value is dropped
 * rather than followed.
 */
export function rekeyedRedirectTarget(err: unknown): string | null {
  const response = asSdkErrorResponse(err);
  if (response?.status !== 404) return null;

  const body = response.error;
  const redirect =
    body && typeof body === 'object'
      ? (body as { redirect?: unknown }).redirect
      : undefined;

  if (
    typeof redirect !== 'string' ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.includes('\\')
  ) {
    return null;
  }
  return redirect;
}

/** Issues a 308 to the record's new URL when the error says it was re-keyed. */
export function redirectIfRekeyed(err: unknown, locale: string): void {
  const target = rekeyedRedirectTarget(err);
  if (target) {
    permanentRedirect(`/${locale}${target}`, RedirectType.replace);
  }
}
