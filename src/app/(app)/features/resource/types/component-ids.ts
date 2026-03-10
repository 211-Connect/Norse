export enum ResourceComponentId {
  // Header section
  BADGES = 'badges',
  RESOURCE_NAME = 'resourceName',
  SERVICE_NAME = 'serviceName',

  // Main info
  ADDRESS = 'address',
  TRANSPORTATION = 'transportation',
  ACCESSIBILITY = 'accessibility',

  // Eligibility & Requirements
  ELIGIBILITY = 'eligibility',
  REQUIRED_DOCUMENTS = 'requiredDocuments',

  // Schedule
  HOURS = 'hours',

  // Contact
  PHONE_NUMBERS = 'phoneNumbers',
  WEBSITE = 'website',
  EMAIL = 'email',

  // Services & Details
  LANGUAGES = 'languages',
  INTERPRETATION_SERVICES = 'interpretationServices',
  APPLICATION_PROCESS = 'applicationProcess',
  FEES = 'fees',
  SERVICE_AREA = 'serviceArea',

  // Description & Categories
  DESCRIPTION = 'description',
  CATEGORIES = 'categories',
  LAST_ASSURED = 'lastAssured',
  ATTRIBUTION = 'attribution',

  // Map
  MAP = 'map',
  GET_DIRECTIONS = 'getDirections',

  // Organization
  ORGANIZATION = 'organization',

  // Complex sections (not using Datum)
  FACETS = 'facets',

  // Layout helpers
  SEPARATOR = 'separator',

  CUSTOM_ATTRIBUTE = 'customAttribute',
}
