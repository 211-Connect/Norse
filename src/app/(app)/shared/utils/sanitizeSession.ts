import { Session } from 'next-auth';

/**
 * Sanitizes the session object for client-side use by removing sensitive tokens.
 *
 * This prevents BREACH vulnerability by ensuring that accessToken and idToken
 * (which contain sensitive Keycloak credentials) are not serialized into the
 * __NEXT_DATA__ script tag in the HTML response.
 *
 * The client only needs user display information (name, email, image) and
 * session status. All API calls are server-side and use getSession() directly.
 */
export function sanitizeSessionForClient(
  session: Session | null,
): Session | null {
  if (!session) {
    return null;
  }

  // Return only the fields needed by client components
  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
      roles: session.user.roles ?? [],
    },
    error: session.error,
    expires: session.expires,
    // Explicitly omit accessToken and idToken
  };
}
