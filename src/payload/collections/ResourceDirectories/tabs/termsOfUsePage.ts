import { Tab } from 'payload';
import { hasContentFieldAccess } from '../../Users/access/permissions';

export const termsOfUsePage: Tab = {
  name: 'termsOfUsePage',
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
