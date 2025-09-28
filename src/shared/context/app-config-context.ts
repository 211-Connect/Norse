import { createContext } from 'react';

type Menu = {
  name: string;
  href: string;
  target: '_self' | '_blank';
};

export type AppConfig = {
  brand?: {
    name: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
    copyright?: string;
  };
  contact?: {
    email?: string;
    number?: string;
    feedbackUrl?: string;
  };
  search?: {
    defaultRadius?: number;
    radiusOptions?: {
      value?: number;
    }[];
    resultsLimit?: number;
  };
  menus?: {
    header?: Menu[];
    footer?: Menu[];
  };
  pages?: {
    home?: {
      heroSection?: {
        backgroundImageUrl?: string;
      };
      disableTour?: boolean;
    };
    resource?: {
      hideCategories?: boolean;
      hideLastAssured?: boolean;
    };
    privacyPolicy?: {
      enabled: boolean;
    };
    termsOfUse?: {
      enabled: boolean;
    };
  };
  adapters: {
    geocoder: 'mapbox';
    map: 'mapbox' | 'maplibre';
  };
  map: {
    center: [number, number];
    zoom: number;
  };
  alert?: {
    text?: string;
    buttonText?: string;
    url?: string;
    variant?: 'destructive' | 'default';
  };
  hideAttribution?: boolean;
  hideCategoriesHeading?: boolean;
  hideDataProvidersHeading?: boolean;
  providers?: {
    name?: string;
    href?: string;
    logo?: string;
  }[];
  sms?: {
    provider: 'Twilio';
  }[];
  newLayout?: {
    enabled?: boolean;
    headerStart?: string;
    headerEnd?: string;
    heroUrl?: string;
    logoUrl?: string;
  };
  translatedConfig: {
    [locale: string]: {
      footer?: {
        disclaimer?: string;
      };
      header?: {
        customHomeUrl?: string;
        searchUrl?: string;
      };
      safeExit?: {
        enabled?: boolean;
        text: string;
        url: string;
      };
    };
  };
};

const appConfigContext = createContext<AppConfig>(null);

export { appConfigContext };
