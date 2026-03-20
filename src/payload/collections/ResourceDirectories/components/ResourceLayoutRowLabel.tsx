'use client';

import { ArrayRowLabel } from '@/payload/components/ArrayRowLabel';
import { useRowLabel, useWatchForm } from '@payloadcms/ui';

const COMPONENT_LABELS: Record<string, string> = {
  badges: 'Badges',
  resourceName: 'Resource Name',
  serviceName: 'Service Name',
  address: 'Address',
  transportation: 'Transportation',
  accessibility: 'Accessibility',
  eligibility: 'Eligibility',
  requiredDocuments: 'Required Documents',
  hours: 'Hours',
  phoneNumbers: 'Phone Numbers',
  website: 'Website',
  email: 'Email',
  languages: 'Languages',
  interpretationServices: 'Interpretation Services',
  applicationProcess: 'Application Process',
  fees: 'Fees',
  serviceArea: 'Service Area',
  description: 'Description',
  categories: 'Categories',
  lastAssured: 'Last Assured',
  attribution: 'Attribution',
  map: 'Map',
  getDirections: 'Get Directions',
  organization: 'Organization',
  facets: 'Facets',
  separator: '— Separator —',
  customAttribute: 'Custom Attribute',
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
