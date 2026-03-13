import { Tab } from 'payload';
import { hasResourceNavigationFieldAccess } from '../../Users/access/permissions';
import { generateUrlFields } from '@/payload/fields/urlField';

export const highlights: Tab = {
  label: 'Highlights',
  name: 'highlights',
  fields: [
    {
      type: 'text',
      name: 'sectionTitle',
      label: 'Section Title',
      defaultValue: 'Featured Resources and News',
      admin: {
        placeholder: 'Featured Resources and News',
        description: 'The title displayed above the highlights section',
      },
      localized: true,
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      type: 'checkbox',
      name: 'enableCarouselAutoplay',
      label: 'Enable Carousel Auto-play',
      defaultValue: false,
      admin: {
        description:
          'Automatically rotate through highlights when there are more than can fit on screen',
      },
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      type: 'number',
      name: 'autoplayInterval',
      label: 'Auto-play Interval (seconds)',
      defaultValue: 5,
      min: 2,
      max: 30,
      admin: {
        description: 'Time in seconds between automatic slide changes',
        condition: (_, siblingData) => {
          return siblingData?.enableCarouselAutoplay === true;
        },
      },
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'Items',
      admin: {
        description:
          'Add callouts to highlight resources, news, or important information. When more items exist than can fit on screen, they will display in a carousel.',
        components: {
          RowLabel: {
            path: '@/payload/collections/ResourceDirectories/components/LocalizedRowLabel',
            clientProps: {
              path: 'highlights.items',
              localizedFieldKey: 'title',
            },
          },
        },
      },
      access: {
        create: hasResourceNavigationFieldAccess,
        update: hasResourceNavigationFieldAccess,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'tenant-media',
              label: 'Image',
              admin: {
                description: 'Image for the highlight card',
              },
            },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: 'Title',
          admin: {
            description: 'The main heading for this highlight',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: 'Description',
          admin: {
            description: 'Brief description or summary of the highlight',
          },
        },
        {
          name: 'buttonText',
          type: 'text',
          localized: true,
          label: 'Button/Link Text',
          admin: {
            description: 'Text displayed on the button or link',
            placeholder: 'Learn More',
          },
        },
        ...generateUrlFields('buttonUrl', false, false),
      ],
    },
  ],
};
