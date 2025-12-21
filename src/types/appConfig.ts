import { Nullable } from './common';

type Menu = {
  name: string;
  href?: Nullable<string>;
  openInNewTab?: Nullable<boolean>;
};

export type AppConfig = {
  accessibility: {
    fontSize: {
      allowedValues: string[];
    };
  };
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
    showFeedbackButtonGlobal: boolean;
    showFeedbackButtonOnResourcePages: boolean;
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
      target?: '_self' | '_blank';
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
    facets: {
      name: string;
      facet: string;
    }[];
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
  sessionId: string;
  suggestions: {
    value: string;
    taxonomies: string;
  }[];
  tenantId?: string;
  alert?: {
    text: string;
    buttonText?: string;
    url?: string;
    target?: '_self' | '_blank';
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
    target?: '_self' | '_blank';
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
        queryType?: 'taxonomy' | 'text' | 'link';
        query?: string;
        href?: string;
        target?: '_self' | '_blank';
      }[];
    }[];
    backText?: string;
    customHeading?: string;
  };
};
