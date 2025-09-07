import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
} from '@/app/shared/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

export function searchLinkCorrectionMiddleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const prefLocation = request.cookies.get(USER_PREF_LOCATION)?.value;
  const prefCoords = request.cookies.get(USER_PREF_COORDS)?.value;
  const prefDistance = request.cookies.get(USER_PREF_DISTANCE)?.value;

  const alreadyHasLocation = searchParams.has('location');
  const alreadyHasCoords = searchParams.has('coords');
  const alreadyHasDistance = searchParams.has('distance');

  if (pathname.endsWith('/search')) {
    let anyChanges = false;
    const url = request.nextUrl.clone();

    if (prefLocation && !alreadyHasLocation) {
      url.searchParams.set('location', prefLocation);
      anyChanges = true;
    }
    if (prefCoords && !alreadyHasCoords) {
      url.searchParams.set('coords', prefCoords);
      anyChanges = true;
    }
    if (prefDistance && !alreadyHasDistance) {
      url.searchParams.set('distance', prefDistance);
      anyChanges = true;
    }

    if (anyChanges) {
      return NextResponse.redirect(url);
    }
  }
}
