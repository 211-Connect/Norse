/**
 * Data for the MBOA (Minnesota Aging & Disability Resources) manual QA
 * checklist, automated in `mboa-qa-checklist*.spec.ts`. Source: the
 * "Connect211-QA Checklist.xlsx" weekly run (sheet `11102026`).
 *
 * Unlike `tenants.ts`, every value here is MBOA-specific (guided search topic
 * names, MN counties, MN resources), so the specs skip for every other tenant.
 * Values are real, live data on stg-mboa / mn.gov — same "no mocks" rule as
 * the rest of the suite, so assertions stay content-presence, never exact
 * counts.
 */

/** Guided search ("topics") links on the MBOA home page, by section heading. */
export const MBOA_GUIDED_TOPICS = {
  taxHelp: { section: 'Money/finances', name: 'Tax help' },
  personalSupport: {
    section: 'Help at home',
    name: 'Personal support / PCA services',
    /** The topic's `query_label`, shown in the search bar on results. */
    searchLabel: 'Personal support/PCA services',
  },
  ecsWaiver: {
    section: 'Waiver Providers',
    name: 'Essential Community Supports (ECS)',
    /** The Payment facet value the topic link pre-selects. */
    paymentFilter: 'Essential Community Supports (ECS)',
  },
  shoppingHelp: { section: 'Help at home', name: 'Shopping help' },
  emergencyShelter: { section: 'Housing', name: 'Emergency shelter' },
  publicTransportation: {
    section: 'Transportation',
    name: 'Public transportation',
  },
  assistedLiving: { section: 'Housing', name: 'Assisted living' },
} as const;

/** The St. Paul address the checklist uses for "Add my location" steps. */
export const MBOA_ST_PAUL_ADDRESS = {
  typed: '540 Cedar Street, Saint Paul, Minnesota 55155',
  suggestion: '540 Cedar Street, Saint Paul, Minnesota 55155, United States',
};

/** The Duluth address used by the Filters scenario. */
export const MBOA_DULUTH_ADDRESS = {
  typed: '221 West 1st Street, Duluth, MN, 55802',
  suggestion: '221 West 1st Street, Duluth, Minnesota 55802, United States',
  city: 'Duluth, MN',
};

export const MBOA_SEARCHES = {
  topic: { typed: 'assisted living', option: 'Assisted living' },
  taxonomy: {
    typed: 'Respite Care',
    code: 'PH-7000',
    label: 'Respite Care',
  },
  text: 'Monarch Healthcare Management',
  suggestion: 'I need transportation.',
  homeRepair: {
    typed: 'Home repair',
    code: 'PH-3300.2750-250',
    label: 'General Minor Home Repair Programs',
  },
};

export const MBOA_FILTERS = {
  titleIII: { group: 'Payment', label: 'Title III' },
  stLouisCounty: { group: 'Area Served by County', label: 'St. Louis County' },
  cacWaiver: {
    group: 'Payment',
    label: 'Community Alternative Care (CAC) Waiver',
  },
  itascaCounty: { group: 'Area Served by County', label: 'Itasca County' },
};

export const MBOA_RESOURCES = {
  oakHill: 'Oak Hill Assisted Living',
  mnRevenue: 'Minnesota Department of Revenue',
};

/** Languages the Homepage Verification scenario cycles through. */
export const MBOA_LANGUAGES = {
  hmong: { code: 'mww', htmlLang: 'mww' },
  others: [
    { code: 'es', htmlLang: 'es' },
    { code: 'so', htmlLang: 'so' },
  ],
} as const;

/** `aria-label` of the header logo link (MBOA tenant branding). */
export const MBOA_LOGO_LINK_NAME = /home page$/i;
