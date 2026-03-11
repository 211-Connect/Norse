import { AppConfig } from '@/types/appConfig';
import { ResourceComponentId } from './component-ids';

export type ResourceLayoutConfig = AppConfig['resource']['layout'];
export type CustomAttributeConfig = NonNullable<
  NonNullable<
    ResourceLayoutConfig['leftColumn' | 'rightColumn']
  >[number]['items']
>[number]['customAttribute'];

export interface LayoutColumnItem {
  componentId: ResourceComponentId;
  customAttribute?: CustomAttributeConfig | null;
}

export const DEFAULT_RESOURCE_LAYOUT: AppConfig['resource']['layout'] = {
  leftColumn: [
    {
      items: [
        { componentId: ResourceComponentId.BADGES },
        { componentId: ResourceComponentId.RESOURCE_NAME },
        { componentId: ResourceComponentId.SERVICE_NAME },
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
