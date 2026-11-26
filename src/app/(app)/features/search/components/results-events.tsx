'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useClientSearchParams } from '@/app/(app)/shared/hooks/use-client-search-params';
import { firstValue } from '@/app/(app)/features/search/intent/slot';
import {
  createResultsEvent,
  SearchLocationContext,
} from '@/app/(app)/shared/lib/google-tag-manager';
import { buildSearchLocationPayload } from '@/app/(app)/shared/lib/search-location-meta';
import {
  AnalyticsEvent,
  AnalyticsTools,
  searchSurfacePayload,
  trackEvent,
} from '@/app/(app)/shared/lib/analytics';
import {
  searchCoordinatesAtom,
  searchLocationGeocodeAtom,
  userCoordinatesAtom,
} from '@/app/(app)/shared/store/search';

interface ResultsEventsProps {
  results: any;
  totalResults: any;
  widgetId?: string;
  /** Set on an SEO landing page: the events then carry `surface: landing`. */
  landingPageId?: string;
}

export const ResultsEvents = ({
  results,
  totalResults,
  widgetId,
  landingPageId,
}: ResultsEventsProps) => {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const { searchParamsObject } = useClientSearchParams();
  const appConfig = useAppConfig();
  const searchCoordinates = useAtomValue(searchCoordinatesAtom);
  const userCoordinates = useAtomValue(userCoordinatesAtom);
  const searchLocationGeocode = useAtomValue(searchLocationGeocodeAtom);
  const widgetSearchTracked = useRef(false);
  const query = firstValue(searchParamsObject.query) ?? '';
  const queryLabel = firstValue(searchParamsObject.query_label) ?? '';

  useEffect(() => {
    let isCancelled = false;

    const trackSearchEvents = async () => {
      const locationPayload = await buildSearchLocationPayload(
        searchCoordinates,
        userCoordinates,
        appConfig.tenantId,
        // The region the server searched, not the one being typed.
        typeof searchParamsObject.region === 'string'
          ? searchParamsObject.region
          : null,
        searchLocationGeocode,
      );

      if (isCancelled) {
        return;
      }

      const locationContext: SearchLocationContext = {
        place: locationPayload?.searchCity || null,
        postcode: locationPayload?.searchZipCode || null,
        regionId: locationPayload?.searchRegionId || null,
      };

      createResultsEvent(
        { results, total: totalResults },
        searchParamsObject,
        appConfig.sessionId,
        locationContext,
      );

      if (widgetId !== undefined && !widgetSearchTracked.current) {
        widgetSearchTracked.current = true;
        const {
          userZipCode: _userZipCode,
          userCounty: _userCounty,
          userCity: _userCity,
          ...widgetLocationPayload
        } = locationPayload;
        trackEvent(AnalyticsEvent.WidgetSearch, AnalyticsTools.Umami, {
          widgetId,
          query,
          queryLabel,
          ...widgetLocationPayload,
        });
      }

      if (totalResults === 0) {
        trackEvent(AnalyticsEvent.SearchZeroResults, AnalyticsTools.Umami, {
          query: String(searchParamsObject.query ?? ''),
          query_label: String(searchParamsObject.query_label ?? ''),
          ...searchSurfacePayload(landingPageId, locale),
          ...locationPayload,
        });
      }
    };

    void trackSearchEvents();

    return () => {
      isCancelled = true;
    };
  }, [
    appConfig.sessionId,
    appConfig.tenantId,
    landingPageId,
    locale,
    query,
    queryLabel,
    results,
    searchCoordinates,
    searchParamsObject,
    totalResults,
    userCoordinates,
    searchLocationGeocode,
    widgetId,
  ]);

  return null;
};
