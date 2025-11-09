import { Tab } from 'payload';
import { hasContentFieldAccess } from '../../Users/access/permissions';

export const privacyPolicyPage: Tab = {
  name: 'privacyPolicyPage',
  access: {
    create: hasContentFieldAccess,
    update: hasContentFieldAccess,
  },
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
