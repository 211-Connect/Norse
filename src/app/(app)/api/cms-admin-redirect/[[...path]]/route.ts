import { NextRequest, NextResponse } from 'next/server';

import { getCmsAdminRedirectUrl } from '@/lib/cms/admin-redirect';

export const dynamic = 'force-dynamic';

/**
 * Sends `/admin` on the public app to the CMS, for admins who still open it on
 * their tenant's host. `next.config.js` rewrites `/admin` here in `app` builds,
 * which leaves the proxy matcher alone. See docs/cms-app-separation-plan.md.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const target = getCmsAdminRedirectUrl(
    process.env.CMS_ADMIN_URL,
    path,
    request.nextUrl.search,
  );

  if (!target) return new NextResponse('Not Found', { status: 404 });

  return NextResponse.redirect(target, 307);
}
