'use client';

import { useRowLabel, useWatchForm } from '@payloadcms/ui';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';

const COMPONENT_LABELS: Record<string, string> = {
  badges: 'Badges',
  resourceName: 'Resource Name',
  serviceName: 'Service Name',
  locationName: 'Location Name',
  locationNameSubtitle: 'Location Name Subtitle',
  organizationAlternateName: 'Organization Alternate Name',
  organizationAlternateNameSubtitle: 'Organization Alternate Name Subtitle',
  address: 'Address',
  transportation: 'Transportation',
  accessibility: 'Accessibility',
  eligibility: 'Eligibility',
  requiredDocuments: 'Required Documents',
  hours: 'Hours',
  contacts: 'Contacts',
  phoneNumbers: 'Phone Numbers',
  website: 'Website',
  organizationUrl: 'Organization URL',
  email: 'Email',
  languages: 'Languages',
  interpretationServices: 'Interpretation Services',
  applicationProcess: 'Application Process',
  fees: 'Fees',
  serviceArea: 'Service Area',
  description: 'Description',
  categories: 'Taxonomies',
  lastAssured: 'Last Assured',
  attribution: 'Data Attribution',
  map: 'Map',
  getDirections: 'Get Directions',
  organization: 'Organization',
  organizationName: 'Organization - Name',
  organizationNameAndAlternateName: 'Organization - Name and Alternate Name',
  organizationNameAndDescription: 'Organization - Name and Description',
  quality: 'Quality',
  facets: 'Facets',
  separator: '— Separator —',
  customAttribute: 'Custom Attribute',
  phone: 'Phone',
  actionButtons: 'Action Buttons',
  alert: 'Alert',
};

const ResourceLayoutRowLabel = ({ path }: { path: string }) => {
  const { rowNumber } = useRowLabel();
  const { getDataByPath } = useWatchForm();

  const arrayData = getDataByPath(path);
  const data = rowNumber === undefined ? {} : arrayData?.[rowNumber] || {};

  const componentId = data?.componentId;
  const title = componentId
    ? COMPONENT_LABELS[componentId] || componentId
    : 'Select component';

  const subtitle =
    componentId === 'customAttribute' && data?.customAttribute?.title
      ? ` - ${data.customAttribute.title}`
      : '';

  return <ArrayRowLabel rowNumber={rowNumber} title={`${title}${subtitle}`} />;
};

export default ResourceLayoutRowLabel;
