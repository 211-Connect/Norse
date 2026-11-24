import type { Field } from 'payload';

/** Which layer of the copy a set of fields edits (docs/landing-pages.md). */
export type CopyScope = 'template' | 'topic';

const COMPONENTS = '@/payload/collections/LandingPages/components';

const field = (scope: CopyScope) => ({
  Field: { path: `${COMPONENTS}/LandingCopyField`, clientProps: { scope } },
});

/**
 * The four texts of a landing page, all localized and all optional: an empty
 * one inherits (topic → Resource Directory template → built-in default). Variables such as `{topic}` and `{location}` are filled when the
 * page renders. Each field shows what it inherits and a character count; a
 * Google-result preview follows.
 */
export const landingCopyFields = (scope: CopyScope): Field[] => [
  {
    name: 'title',
    type: 'text',
    localized: true,
    admin: {
      components: field(scope),
      description:
        'SEO title: the blue link in Google results. About 60 characters.',
    },
  },
  {
    name: 'description',
    type: 'textarea',
    localized: true,
    admin: {
      components: field(scope),
      description:
        'Meta description: the grey text under the link. About 155 characters. It changes how many people click, not the ranking.',
    },
  },
  {
    name: 'h1',
    type: 'text',
    localized: true,
    admin: {
      components: field(scope),
      description: 'The main heading on the page.',
    },
  },
  {
    name: 'intro',
    type: 'textarea',
    localized: true,
    admin: {
      components: field(scope),
      description: 'A short paragraph above the results.',
    },
  },
  {
    name: 'preview',
    type: 'ui',
    admin: {
      components: {
        Field: {
          path: `${COMPONENTS}/LandingCopyPreview`,
          clientProps: { scope },
        },
      },
    },
  },
];
