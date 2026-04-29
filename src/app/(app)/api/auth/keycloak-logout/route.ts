import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';
import { NextRequest, NextResponse } from 'next/server';

function normalizeNextPath(nextPath: string | null): string {
  if (!nextPath) {
    return '/auth/signin';
  }

  if (!nextPath.startsWith('/')) {
    return '/auth/signin';
  }

  if (nextPath.startsWith('//')) {
    return '/auth/signin';
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const host =
    process.env.CUSTOM_AUTH_HOST ||
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';

  const protocol =
    process.env.CUSTOM_AUTH_PROTOCOL ||
    request.headers.get('x-forwarded-proto') ||
    'https';

  const parsedHost = parseHost(host);
  const tenant = await findTenantByHost(parsedHost);

  const requestedNext = request.nextUrl.searchParams.get('next');
  const nextPath = normalizeNextPath(requestedNext);
  const baseUrl = `${protocol}://${host}`;
  const postLogoutRedirectUri = new URL(nextPath, baseUrl).toString();

  const issuer = tenant?.auth?.keycloakIssuer;
  if (!issuer) {
    return NextResponse.redirect(postLogoutRedirectUri);
  }

  const keycloakLogoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  keycloakLogoutUrl.searchParams.set(
    'post_logout_redirect_uri',
    postLogoutRedirectUri,
  );

  if (process.env.KEYCLOAK_CLIENT_ID) {
    keycloakLogoutUrl.searchParams.set(
      'client_id',
      process.env.KEYCLOAK_CLIENT_ID,
    );
  }

  return NextResponse.redirect(keycloakLogoutUrl.toString());
}
