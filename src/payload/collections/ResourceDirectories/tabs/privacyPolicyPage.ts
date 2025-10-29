import { Tab } from 'payload';

export const privacyPolicyPage: Tab = {
  name: 'privacyPolicyPage',
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
