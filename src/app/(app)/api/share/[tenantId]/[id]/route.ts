import { NextResponse } from 'next/server';
import { expandShortUrl } from '@/app/(app)/shared/serverActions/shortUrl/expandShortUrl';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; tenantId?: string }> },
) {
  const { id, tenantId } = await params;
  try {
    const url = await expandShortUrl(id, tenantId);
    if (url) {
      return NextResponse.redirect(url, 302);
    } else {
      return NextResponse.redirect('/404', 302);
    }
  } catch (err) {
    return NextResponse.redirect('/404', 302);
  }
}

export async function POST() {
  return NextResponse.redirect('/404', 302);
}
