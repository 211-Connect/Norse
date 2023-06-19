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

export async function createEvent<T>(event: T) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
}
