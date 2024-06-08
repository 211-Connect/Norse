export interface IAppConfig {
  brand?: {
    name?: string;
    logoUrl?: string;
    faviconUrl?: string;
    openGraphUrl?: string;
  };
  alert?: {
    text?: string;
    buttonText?: string;
    url?: string;
  };
  contact?: {
    email?: string;
    phoneNumber?: string;
    feedbackUrl?: string;
  };
  adapters: {
    database: 'postgres' | 'mongodb';
    search: 'elasticsearch'; // considering supporting other search engines in the future
    map: 'mapbox'; // will support Google in the future
    sms: 'twilio'; // considering supporting other sms providers in the future
  };
  features?: {
    search?: {
      defaultRadius?: number;
      radiusOptions?: {
        value: number;
      }[];
    };
    map?: {
      center?: [number, number]; // [LONGITUDE, LATITUDE]
    };
    sms?: {};
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
  providers?: {
    name?: string;
    href?: string;
    logoUrl?: string;
  }[];
}
