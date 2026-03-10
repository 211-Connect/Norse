import { ResourceComponentId } from './component-ids';

export interface LayoutColumnItem {
  componentId: ResourceComponentId;
  customAttribute?: {
    title?: string;
    subtitle?: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    url?: string;
    urlTarget?: '_blank' | '_self';
    titleBelow?: boolean;
    size?: 'sm' | 'md';
  };
}

export interface ResourceLayout {
  leftColumn: { items: LayoutColumnItem[]; isCard: boolean }[];
  rightColumn: { items: LayoutColumnItem[]; isCard: boolean }[];
}

export const DEFAULT_RESOURCE_LAYOUT: ResourceLayout = {
  leftColumn: [
    {
      items: [
        { componentId: ResourceComponentId.HEADER },
        { componentId: ResourceComponentId.ADDRESS },
        { componentId: ResourceComponentId.TRANSPORTATION },
        { componentId: ResourceComponentId.ACCESSIBILITY },
        { componentId: ResourceComponentId.ELIGIBILITY },
        { componentId: ResourceComponentId.REQUIRED_DOCUMENTS },
        { componentId: ResourceComponentId.HOURS },
        { componentId: ResourceComponentId.SEPARATOR },
        { componentId: ResourceComponentId.PHONE_NUMBERS },
        { componentId: ResourceComponentId.WEBSITE },
        { componentId: ResourceComponentId.EMAIL },
        { componentId: ResourceComponentId.SEPARATOR },
        { componentId: ResourceComponentId.LANGUAGES },
        { componentId: ResourceComponentId.INTERPRETATION_SERVICES },
        { componentId: ResourceComponentId.APPLICATION_PROCESS },
        { componentId: ResourceComponentId.FEES },
        { componentId: ResourceComponentId.SERVICE_AREA },
      ],
      isCard: true,
    },
    {
      items: [{ componentId: ResourceComponentId.FACETS }],
      isCard: true,
    },
  ],
  rightColumn: [
    {
      items: [
        { componentId: ResourceComponentId.DESCRIPTION },
        { componentId: ResourceComponentId.LAST_ASSURED },
        { componentId: ResourceComponentId.ATTRIBUTION },
        { componentId: ResourceComponentId.CATEGORIES },
      ],
      isCard: true,
    },
    {
      items: [{ componentId: ResourceComponentId.MAP }],
      isCard: false,
    },
    {
      items: [{ componentId: ResourceComponentId.GET_DIRECTIONS }],
      isCard: false,
    },
    {
      items: [{ componentId: ResourceComponentId.ORGANIZATION }],
      isCard: true,
    },
  ],
};
