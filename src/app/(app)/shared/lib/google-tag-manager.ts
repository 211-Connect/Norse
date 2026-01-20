'use client';

import { getCookies } from 'cookies-next/client';
import {
  USER_PREF_COUNTRY,
  USER_PREF_DISTRICT,
  USER_PREF_PLACE,
  USER_PREF_POSTCODE,
  USER_PREF_REGION,
} from './constants';
import { ResultType } from '../store/results';

export interface ReferralEventProps {
  event: string;
}

export interface SearchEvent {
  event: string;
  query?: string | string[] | null;
  query_label?: string | string[] | null;
  query_language?: string | null;
  location?: string | null;
  results?: boolean | null;
  country?: string | null;
  district?: string | null;
  place?: string | null;
  postcode?: string | null;
  region?: string | null;
}

export interface PageViewEvent {
  event: string;
  page: string;
}

export interface NoResultEvent {
  event: string;
  query: string;
  query_label: string;
  query_language: string;
  location: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const getFromSessionStorage = (key: string, sessionId: string) => {
  if (key == null) return;

  const itemKey = `event.${sessionId}.${key}`; // event.1234.pageview
  return JSON.parse(sessionStorage.getItem(itemKey) || 'null');
};

const setSessionStorage = (key: string, value: any, sessionId: string) => {
  if (key == null || value == null) return;

  const itemKey = `event.${sessionId}.${key}`; // event.1234.pageview
  sessionStorage.setItem(itemKey, JSON.stringify(value || {}));
};

export const createFeedbackEvent = (e: any) => {
  if (isDevelopment) {
    console.log({
      event: '/// FEEDBACK EVENT ///',
      data: e,
    });
  }
};

export const createLinkEvent = (e: any) => {
  if (isDevelopment) {
    console.log({
      event: '/// LINK EVENT ///',
      data: e,
    });
  }
};

export const createPageViewEvent = (e: any, sessionId: string) => {
  const eventExists = getFromSessionStorage(`pageview-${e.url}`, sessionId);

  if (!eventExists) {
    if (isDevelopment) {
      console.log({
        event: '/// PAGE VIEW EVENT ///',
        data: e,
      });
    }

    const newEvent = {
      event: 'pageview',
      page: e.url,
    };

    createEvent<PageViewEvent>(newEvent);
    setSessionStorage(`pageview-${e.url}`, newEvent, sessionId);
  }
};

export const createReferralEvent = (
  referralType: 'call_referral' | 'website_referral' | 'directions_referral',
  resourceId: string,
  resource: Partial<ResultType>,
  query: any,
  sessionId: string,
) => {
  const eventExists = getFromSessionStorage(
    `referral.${resourceId}`,
    sessionId,
  );

  if (!eventExists) {
    if (isDevelopment) {
      console.log({
        event: '/// REFERRAL EVENT ///',
        data: { referralType, resourceId, resource },
      });
    }

    const newEvent = {
      event: 'referral',
      ...resource,
      ...query,
      title: resource.name,
    };

    createEvent<ReferralEventProps>(newEvent);
    setSessionStorage(`referral.${resourceId}`, newEvent, sessionId);
  }

  const eventExists2 = getFromSessionStorage(
    `${referralType}.${resourceId}`,
    sessionId,
  );
  if (!eventExists2) {
    if (isDevelopment) {
      console.log({
        event: '/// REFERRAL EVENT ///',
        data: { referralType, resourceId, resource },
      });
    }

    const newEvent = {
      event: referralType,
      ...resource,
      ...query,
      title: resource.name,
    };

    createEvent<ReferralEventProps>(newEvent);
    setSessionStorage(`${referralType}.${resourceId}`, newEvent, sessionId);
  }
};

export const createResultsEvent = (e: any, query: any, sessionId: string) => {
  if (query.query_type === 'taxonomy') {
    const eventExists = getFromSessionStorage(
      `search.${query.query}`,
      sessionId,
    );
    const cookies = getCookies() ?? {};

    if (!eventExists) {
      if (isDevelopment) {
        console.log({
          event: '/// RESULTS EVENT ///',
          data: e,
        });
      }

      const newEvent = {
        event: 'search',
        ...query,
        results: e.total,
        country: cookies[USER_PREF_COUNTRY] ?? null,
        district: cookies[USER_PREF_DISTRICT] ?? null,
        place: cookies[USER_PREF_PLACE] ?? null,
        postcode: cookies[USER_PREF_POSTCODE] ?? null,
        region: cookies[USER_PREF_REGION] ?? null,
      };

      createEvent<SearchEvent>(newEvent);
      setSessionStorage(`search.${query.query}`, newEvent, sessionId);

      const taxonomies = (query?.query as string)?.split(',') ?? [];
      for (const taxonomy of taxonomies) {
        const eventExists = getFromSessionStorage(
          `taxonomy.${taxonomy}`,
          sessionId,
        );

        if (!eventExists) {
          const newEvent = {
            event: 'taxonomy',
            taxonomy: taxonomy,
            ...query,
            results: e.total,
          };

          createEvent<SearchEvent>(newEvent);
          setSessionStorage(`taxonomy.${taxonomy}`, newEvent, sessionId);
        }
      }
    }
  } else {
    const eventExists = getFromSessionStorage(
      `search.${query.query}`,
      sessionId,
    );
    const cookies = getCookies() ?? {};

    if (!eventExists) {
      if (isDevelopment) {
        console.log({
          event: '/// RESULTS EVENT ///',
          data: e,
        });
      }

      const newEvent = {
        event: 'search',
        ...query,
        results: e.total,
        query_label: query?.query ?? null,
        country: cookies[USER_PREF_COUNTRY] ?? null,
        district: cookies[USER_PREF_DISTRICT] ?? null,
        place: cookies[USER_PREF_PLACE] ?? null,
        postcode: cookies[USER_PREF_POSTCODE] ?? null,
        region: cookies[USER_PREF_REGION] ?? null,
      };

      createEvent<SearchEvent>(newEvent);
      setSessionStorage(`search.${query.query}`, newEvent, sessionId);
    }
  }
};

export const createTourEvent = (data: any) => {
  if (isDevelopment) {
    console.log({
      event: '/// TOUR EVENT ///',
      data: data,
    });
  }
};

export function createEvent<T>(event: T) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
}
