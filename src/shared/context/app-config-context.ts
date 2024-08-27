import { createContext } from 'react';

type Menu = {
  name: string;
  href: string;
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
    map: 'mapbox';
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
  features?: {
    sms: any;
  }[];
};

const appConfigContext = createContext<AppConfig>(null);

export { appConfigContext };
