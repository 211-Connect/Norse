import { createContext } from 'react';

type Menu = {
  name: string;
  href: string;
  target: '_self' | '_blank';
};

type AppConfig = {
  brand?: {
    name: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
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
  };
  hideAttribution?: boolean;
  providers?: {
    name?: string;
    href?: string;
    logo?: string;
  }[];
  sms?: {
    provider: 'Twilio';
  }[];
};

const appConfigContext = createContext<AppConfig>(null);

export { appConfigContext };
