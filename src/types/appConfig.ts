import { ResourceDirectoryBadgeListItem } from '@/payload/collections/ResourceDirectories/types/badge';
import { ResourceDirectory } from '@/payload/payload-types';

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
  sms: {
    provider: 'Twilio' | 'EMS';
  } | null;
  featureFlags: {
    requireUserLocation: boolean;
    showFeedbackButtonGlobal: boolean;
    showFeedbackButtonOnResourcePages: boolean;
    showHomePageTour: boolean;
    showPrintButton: boolean;
    showSearchAndResourceServiceName: boolean;
    showSuggestionListTaxonomyBadge: boolean;
    showUseMyLocationButtonOnDesktop: boolean;
    turnResourceCardTaxonomiesIntoLinks: boolean;
    requireAuthenticationForFavorites: boolean;
  };
  footer: {
    customMenu: Menu[];
    disclaimer?: string;
  };
  header: {
    customMenu: Menu[];
    customHomeUrl?: string;
    favoritesButtonLabel?: string;
    feedbackButtonLabel?: string;
    safeExit?: {
      enabled?: boolean;
      text?: string;
      url?: string;
      target?: '_self' | '_blank';
    };
    searchUrl?: string;
    position: 'sticky' | 'static';
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
    categoriesText?: string;
    lastAssuredText?: string;
    layout: {
      leftColumn: NonNullable<ResourceDirectory['resource']>['leftColumn'];
      rightColumn: NonNullable<ResourceDirectory['resource']>['rightColumn'];
    };
  };
  search: {
    facets: {
      name: string;
      facet: string;
      showInDetails?: boolean;
    }[];
    map: {
      center: [number, number];
      zoom: number;
    };
    radiusOptions: {
      value?: number;
    }[];
    defaultRadius?: number;
    hybridSemanticSearchEnabled: boolean;
    resultsLimit: number;
    texts?: {
      title?: string;
      queryInputPlaceholder?: string;
      locationInputPlaceholder?: string;
      suggestionHeaders?: {
        suggestions?: string;
        categories?: string;
        taxonomies?: string;
      };
      viewDetailsText?: string;
      useTextLinkForViewDetails?: boolean;
      noResultsFallbackText?: string;
    };
    cardLayout?: NonNullable<ResourceDirectory['search']['cardLayout']>;
  };
  sessionId: string;
  badges: ResourceDirectoryBadgeListItem[];
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
  gtmContainerId?: string;
  heroUrl?: string;
  highlights?: {
    sectionTitle?: string;
    enableCarouselAutoplay?: boolean;
    autoplayInterval?: number;
    items?: {
      image?: string;
      title: string;
      description?: string;
      buttonText?: string;
      buttonUrl?: string;
      openInNewTab?: boolean;
    }[];
  };
  matomoContainerUrl?: string;
  umamiWebsiteId?: string;
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
