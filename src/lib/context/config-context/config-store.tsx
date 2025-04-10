import { createStore } from 'zustand';
import { Alert, Category, DataProvider, Menu } from './types';

export type ConfigState = {
  brand: {
    name: string;
    logoUrl: string;
  };
  contact: {
    feedbackUrl: string;
  };
  alert: Alert;
  dataProviders: DataProvider[];
  categories: Category[];
  menus: {
    header: Menu[];
    footer: Menu[];
  };
};

export type ConfigStore = ConfigState;

const defaultInitialState: ConfigState = {
  brand: {
    name: 'Community Resources',
    logoUrl: '/logo.png',
  },
  contact: {
    feedbackUrl: '/',
  },
  alert: {
    text: 'This is the default alert displayed after installation.',
    buttonText: 'Update Config',
    href: '/',
  },
  dataProviders: [],
  categories: [
    {
      name: 'Disabilities',
      subcategories: [
        {
          name: 'Early Intervention',
        },
        {
          name: 'Employment',
        },
        {
          name: 'Financial Support',
        },
        {
          name: 'Assistive Technology',
        },
      ],
    },
    {
      name: 'Domestic Violence',
      subcategories: [
        {
          name: 'Hotline',
        },
        {
          name: 'Shelter',
        },
      ],
    },
    {
      name: 'Employment',
      subcategories: [
        {
          name: 'Job Search',
        },
        {
          name: 'Job Seeking Skills',
        },
        {
          name: 'Youth',
        },
      ],
    },
  ],
  menus: {
    header: [],
    footer: [],
  },
};

export const createConfigStore = (
  initialState: ConfigState = defaultInitialState,
) => {
  return createStore<ConfigStore>()(() => initialState);
};
