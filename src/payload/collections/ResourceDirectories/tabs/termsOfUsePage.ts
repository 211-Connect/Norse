import { Tab } from 'payload';

export const termsOfUsePage: Tab = {
  name: 'termsOfUsePage',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
};
