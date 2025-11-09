import { Tab } from 'payload';
import { hasLayoutFieldAccess } from '../../Users/access/permissions';

export const resource: Tab = {
  name: 'resource',
  fields: [
    {
      name: 'lastAssuredText',
      type: 'text',
      localized: true,
      access: {
        create: hasLayoutFieldAccess,
        update: hasLayoutFieldAccess,
      },
    },
  ],
};
