export interface IAppConfig {
  brand?: {
    name?: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
  };
  contact?: {
    email?: string;
    phoneNumber?: string;
    feedbackUrl?: string;
  };
  features?: {
    search?: {
      adapter?: 'elasticsearch'; // considering supporting other search engines in the future
      defaultRadius?: number;
      radiusOptions?: {
        value: number;
      }[];
    };
    map?: {
      adapter?: 'mapbox'; // will support Google in the future
      center?: [number, number]; // [LONGITUDE, LATITUDE]
    };
    sms?: {
      adapter?: 'twilio'; // considering supporting other sms providers in the future
    };
  };
  pages?: {
    default?: {
      meta?: {
        title?: string;
        description?: string;
      };
    };
    home?: {
      heroSection?: {
        backgroundImageUrl?: string;
      };
      meta?: {
        title?: string;
        description?: string;
      };
      disableTour?: boolean;
      hideLocationInput?: boolean;
    };
    resource?: {
      hideCategories?: boolean;
      hideLastAssured?: boolean;
    };
  };
  menus?: {
    header?: {
      name?: string;
      href?: string;
    }[];
    footer?: {
      name?: string;
      href?: string;
    }[];
  };
  providers?: {
    name?: string;
    href?: string;
    logoUrl?: string;
  }[];
}
