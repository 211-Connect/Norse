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
  };
  menus?: {
    header?: Menu[];
  };
};

const appConfigContext = createContext<AppConfig>(null);

export { appConfigContext };
