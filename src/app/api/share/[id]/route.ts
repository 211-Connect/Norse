import { NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { ShortUrlService } from '@/app/shared/services/short-url-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const url = await ShortUrlService.expandUrl(id);
    if (url) {
      return NextResponse.redirect(url, 302);
    } else {
      return NextResponse.redirect('/404', 302);
    }
  } catch (err) {
    if (isAxiosError(err)) {
      console.error(err.response?.data);
    }
    return NextResponse.redirect('/404', 302);
  }
}

export async function POST() {
  return NextResponse.redirect('/404', 302);
}
