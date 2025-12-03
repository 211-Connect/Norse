import { Nullable } from './common';

type Menu = {
  name: string;
  href?: Nullable<string>;
  target?: Nullable<'_self' | '_blank'>;
};

export type AppConfig = {
  baseUrl: string;
  brand: {
    name: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
    copyright?: string;
    theme: {
      primaryColor?: string;
      secondaryColor?: string;
      borderRadius?: string;
    };
  };
  contact: {
    number?: string;
    feedbackUrl?: string;
  };
  featureFlags: {
    hideCategoriesHeading: boolean;
    hideDataProvidersHeading: boolean;
    requireUserLocation: boolean;
    showHomePageTour: boolean;
    showResourceLastAssuredDate: boolean;
    showPrintButton: boolean;
    showResourceCategories: boolean;
    showResourceAttribution: boolean;
    showSearchAndResourceServiceName: boolean;
    showSuggestionListTaxonomyBadge: boolean;
    showUseMyLocationButtonOnDesktop: boolean;
    turnResourceCardTaxonomiesIntoLinks: boolean;
    useHybridSemanticSearch: boolean;
  };
  footer: {
    customMenu: Menu[];
    disclaimer?: string;
  };
  header: {
    customMenu: Menu[];
    customHomeUrl?: string;
    safeExit?: {
      enabled?: boolean;
      text?: string;
      url?: string;
    };
    searchUrl?: string;
  };
  i18n: {
    defaultLocale: string;
    locales: string[];
  };
  meta: {
    description: string;
    title: string;
  };
  pages: {
    privacyPolicyPage: {
      enabled: boolean;
      title?: string;
      content?: string;
    };
    termsOfUsePage: {
      enabled: boolean;
      title?: string;
      content?: string;
    };
  };
  resource: {
    lastAssuredText?: string;
  };
  search: {
    map: {
      center: [number, number];
      zoom: number;
    };
    radiusOptions: {
      value?: number;
    }[];
    defaultRadius?: number;
    resultsLimit: number;
    texts?: {
      title?: string;
      queryInputPlaceholder?: string;
      locationInputPlaceholder?: string;
      noResultsFallbackText?: string;
    };
  };
  suggestions: {
    value: string;
    taxonomies: string;
  }[];
  tenantId?: string;
  alert?: {
    text: string;
    buttonText?: string;
    url?: string;
    variant?: 'destructive' | 'default';
  };
  customBasePath?: string;
  errorTranslationData?: {
    errorNamespaces: string[];
    resources: Record<string, Record<string, unknown>>;
    locale: string;
  };
  gtmContainerId?: string;
  heroUrl?: string;
  matomoContainerUrl?: string;
  newLayout?: {
    callouts?: {
      options?: {
        type: 'Call' | 'SMS' | 'Chat' | 'Email';
        customImg?: string;
        description?: string;
        title?: string;
        url?: string;
        urlTarget?: '_self' | '_blank';
      }[];
      title?: string;
    };
    enabled?: boolean;
    headerStart?: string;
    headerEnd?: string;
    heroUrl?: string;
    logoUrl?: string;
  };
  providers?: {
    name?: string;
    href?: string;
    logo?: string;
  }[];
  providersCustomHeading?: string;
  smsProvider?: 'Twilio';
  topics: {
    iconSize: 'small' | 'medium';
    imageBorderRadius?: number;
    list: {
      name: string;
      image?: string;
      href?: string;
      target?: '_self' | '_blank';
      subtopics: {
        name: string;
        queryType?: 'taxonomy' | 'text';
        query?: string;
        href?: string;
        target?: '_self' | '_blank';
      }[];
    }[];
    backText?: string;
    customHeading?: string;
  };
};
