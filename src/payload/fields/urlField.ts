import { Field } from 'payload';

export const generateUrlFields = (
  name = 'url',
  required = false,
  localized = false,
): Field[] => [
  {
    type: 'row',
    admin: {
      className: 'url-field-row',
    },
    fields: [
      {
        name,
        type: 'text',
        label: 'Url',
        required,
        localized,
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        label: 'Open in new window/tab',
        defaultValue: false,
      },
    ],
  },
];
