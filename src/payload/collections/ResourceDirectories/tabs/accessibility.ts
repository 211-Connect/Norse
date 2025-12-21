import { Tab } from 'payload';
import { hasFeatureFieldAccess } from '../../Users/access/permissions';

export const accessibility: Tab = {
  name: 'accessibility',
  fields: [
    {
      name: 'fontSizeAdjustment',
      type: 'select',
      options: ['150%', '175%', '200%'],
      access: {
        create: hasFeatureFieldAccess,
        update: hasFeatureFieldAccess,
      },
    },
  ],
};
