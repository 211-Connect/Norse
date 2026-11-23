import type { Field } from 'payload';

/**
 * The four texts of a landing page, all localized and all optional: an empty
 * one inherits (page → topic → Resource Directory template). Variables such
 * as `{topic}` and `{location}` are filled when the page renders.
 */
export const landingCopyFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    localized: true,
    admin: {
      description:
        'SEO title: the blue link in Google results. About 60 characters.',
    },
  },
  {
    name: 'description',
    type: 'textarea',
    localized: true,
    admin: {
      description:
        'Meta description: the grey text under the link. About 155 characters. It changes how many people click, not the ranking.',
    },
  },
  {
    name: 'h1',
    type: 'text',
    localized: true,
    admin: { description: 'The main heading on the page.' },
  },
  {
    name: 'intro',
    type: 'textarea',
    localized: true,
    admin: { description: 'A short paragraph above the results.' },
  },
];
