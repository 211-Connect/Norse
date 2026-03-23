import { AppConfig } from '@/types/appConfig';
import { SearchCardComponentId } from './card-component-ids';

export type SearchCardLayoutConfig = NonNullable<
  AppConfig['search']['cardLayout']
>;
export type SearchCardLayoutItem = SearchCardLayoutConfig[number];
export type SearchCardCustomAttributeConfig = NonNullable<
  SearchCardLayoutItem['customAttribute']
>;

export const DEFAULT_SEARCH_CARD_LAYOUT: SearchCardLayoutConfig = [
  { componentId: SearchCardComponentId.BADGES },
  { componentId: SearchCardComponentId.RESOURCE_NAME },
  { componentId: SearchCardComponentId.SERVICE_NAME },
  { componentId: SearchCardComponentId.ADDRESS },
  { componentId: SearchCardComponentId.PHONE },
  { componentId: SearchCardComponentId.WEBSITE },
  { componentId: SearchCardComponentId.DESCRIPTION },
  { componentId: SearchCardComponentId.CATEGORIES },
  { componentId: SearchCardComponentId.SEPARATOR },
  { componentId: SearchCardComponentId.ACTION_BUTTONS },
];
