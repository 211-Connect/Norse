import { NextResponse } from 'next/server';
import { serverSideAppConfig } from '@/app/(app)/shared/lib/server-utils';

let appConfig: any | null = null;

async function getLogoUrl() {
  if (!appConfig) {
    const { appConfig: newAppConfig } = await serverSideAppConfig();
    appConfig = newAppConfig;
  }
  return appConfig?.brand?.logoUrl;
}

export async function GET() {
  const logoUrl = await getLogoUrl();
  if (!logoUrl) {
    return NextResponse.redirect('/500', 302);
  }
  return NextResponse.redirect(logoUrl, 302);
}

export async function HEAD() {
  const logoUrl = await getLogoUrl();
  if (!logoUrl) {
    return NextResponse.redirect('/500', 302);
  }
  return NextResponse.redirect(logoUrl, 302);
}
